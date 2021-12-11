using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Numerics;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Nethereum.Web3;
using Utilities;
using Utilities.Bids;

namespace server.components.nft
{
    [ApiController]
    [Route("api/[controller]")]

    public class NftController: ControllerBase
    {
        readonly IDbService _dbService;
        readonly IStorageProvider _storage;
        readonly ILogger _logger;
        readonly WalletService _wallet;

        readonly Utilities.nftdeploy.Web3Config _web3Config;

        public NftController(Utilities.IDbService db,
            IStorageProvider storage,
            IConfiguration config,
            WalletService wallet,
            ILogger<NftController> logger)
        {
            _logger = logger;
            _dbService = db;
            _storage = storage;
            _wallet = wallet;
            _web3Config = config.GetSection("web3").Get<Utilities.nftdeploy.Web3Config>();
        }


        /// <summary>
        /// map of public paths and Stored Tracks
        /// </summary>
        [HttpGet("salesinfo")]
        public async Task<SalesInfoModel> getSalesinfo()
        {
            return new SalesInfoModel
            {
                marketWallet = (await _wallet.getAccount(WalletService.wallet_Deployment)).Address,
                bidMakerAddress = _web3Config.bidMaker,
                nftBaseUrl = _web3Config.nftBaseUrl,
                chainInfo = _web3Config.chainInfo,
                cbFactoryAddress = _web3Config.cbFactory,
                salesBookAddress = _web3Config.salesBook
            };
        }

        [HttpGet("ordersByTrack/{escapedTrackId}")]
        public async Task<SalesOrderModel[]> ordersByTrack(string escapedTrackId, string lastCompleted = null)
        {
            var trackId = Uri.UnescapeDataString(escapedTrackId);
            if (string.IsNullOrWhiteSpace(trackId))
                throw new ArgumentNullException(trackId);

            var collection = _dbService.getCollection<SalesOrderModel>();

            //var filter = Builders< SalesOrderModel >.Filter

            var ret= (await collection.Find(b => b.details.trackId == trackId && string.IsNullOrEmpty(b.buyTx)).ToListAsync()).ToArray();

            return await updateSalesBook(ret, trackId, lastCompleted);

        }

        async Task<SalesOrderModel[]> updateSalesBook(SalesOrderModel[] ret, string trackId, string lastCompleted = null)
        {
            try
            {
                var tracksCollection = _dbService.getCollection<StoredTrackModel>();
                var track = await tracksCollection.Find(t => t.id == trackId).SingleAsync();

                if (null == track.nft)
                {
                    throw new Exception($"NFT details missing from track Id {trackId}");
                }


                var chainInfo = _web3Config.chainInfo[track.nft.chainId];

                var web3 = new Web3(await _wallet.getAccount(WalletService.wallet_Deployment, track.nft.chainId),
                   chainInfo.rpcProvider
                );

                var cbTrack = new Utilities.ColorTrackClonable.ColorTrackClonableService(web3, track.nft.contractAddress);

                if(ret.Length > 0)
                {
                    var stillApproved = await Task.WhenAll( ret.Select(async saleModel =>
                    {
                        var approved = await cbTrack.GetApprovedQueryAsync(BigInteger.Parse( saleModel.details.tokenId));

                        if (approved != _web3Config.salesBook)
                            return null;

                        return saleModel;

                    }));

                    stillApproved = stillApproved.Where(a => null != a).ToArray();

                    if (stillApproved.Length > 0)
                        return stillApproved;
                }

                var totalSupply = (await cbTrack.TotalSupplyQueryAsync());

                int longCount = int.Parse(totalSupply.ToString());

                var slices = await Task.WhenAll(Enumerable.Range(0, longCount).Select(async i =>
                {
                    try
                    {
                        var tokenId = (await cbTrack.TokenByIndexQueryAsync(i));
                        var approved = await cbTrack.GetApprovedQueryAsync(tokenId);

                        if (approved != _web3Config.salesBook)
                            return null;

                        var uri = await cbTrack.TokenURIQueryAsync(tokenId);
                        string queryString = new System.Uri(uri).Query;

                        var queryDictionary = System.Web.HttpUtility.ParseQueryString(queryString);

                        var begin = long.Parse(queryDictionary["begin"]);
                        var end = long.Parse(queryDictionary["end"]);

                        var count = end - begin;

                        return new { tokenId = tokenId.ToString(), count };
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"failed to get token {i} info for Track {trackId}: {ex}");
                        return null;
                    }
                }));

                var maxOne = slices.Where(s=>null != s).OrderByDescending(s => s.count).FirstOrDefault();

                if(null == maxOne)
                {
                    _logger.LogInformation($"no more slices left for track {trackId}");
                    return new SalesOrderModel[] { };
                }

                var ordersCollection = _dbService.getCollection<SalesOrderModel>();

                if (string.IsNullOrEmpty(lastCompleted))
                {
                    _logger.LogDebug("reusing last one");
                    lastCompleted = await ordersCollection.Find(o => o.details.trackId == trackId).Project(o=>o.id).FirstOrDefaultAsync();
                    if(string.IsNullOrWhiteSpace(lastCompleted))
                    {
                        _logger.LogInformation($"no slices found for track {trackId}");
                        return new SalesOrderModel[] { };
                    }
                }

                var doneR = await ordersCollection.UpdateOneAsync(o => o.id == lastCompleted,
                    Builders<SalesOrderModel>.Update
                    .Set(o => o.details.tokenId, maxOne.tokenId)
                    .Unset(o=>o.buyTx)
                    );

                if (!doneR.IsAcknowledged)
                    throw new Exception("mongo failed to ack");


                return (await ordersCollection.Find(o => o.id == lastCompleted).ToListAsync()).ToArray();
                

            }
            catch (Exception ex)
            {
                _logger.LogError($"failed to update orgder book {ex}");
                return new SalesOrderModel[] { };
            }
        }


        [HttpGet("bidsByTrack/{escapedTrackId}")]
        public async Task<BidModel[]> bidsByTrack(string escapedTrackId)
        {
            var trackId = Uri.UnescapeDataString(escapedTrackId);
            if (string.IsNullOrWhiteSpace(trackId))
                throw new ArgumentNullException(trackId);

            var baseUrl = $"{_web3Config.nftBaseUrl}/{trackId}";

            var collection = _dbService.getCollection<BidModel>();

            return (await collection.Find(b => b.details.baseUrl == baseUrl).ToListAsync()).ToArray();
        }


        [HttpGet("bidsByBidder/{escapedBidder}")]
        public async Task<BidModel[]> bidsByBidder(string escapedBidder)
        {
            var bidder = Uri.UnescapeDataString(escapedBidder);
            if (string.IsNullOrWhiteSpace(bidder))
                throw new ArgumentNullException(bidder);

            var collection = _dbService.getCollection<BidModel>();

            var ret = (await collection.Find(b => b.details.bidderAddress == bidder).ToListAsync()).ToArray();
            return ret;
        }

        /// <summary>
        /// should be need Authorization??????
        /// in real we should look at the blokc cain ourselves
        /// </summary>
        /// <param name="bid"></param>
        /// <returns></returns>
        [HttpPost("bid/{escapedId}")]
        public async Task<BidModel> registerBid(string escapedId, [FromBody] BidDetailsModel details)
        {
            var contractId = Uri.UnescapeDataString(escapedId);
            if (string.IsNullOrWhiteSpace(contractId))
                throw new ArgumentNullException(escapedId);

            //todo: check in the blockchain
            var collection = _dbService.getCollection<BidModel>();

            var done = await collection.UpdateOneAsync(b => b.id == contractId,
                Builders<BidModel>.Update
                .Set(b => b.details, details)
                .SetOnInsert(b=>b.id,contractId),
                new UpdateOptions { 
                    IsUpsert=true
            });

            if (!done.IsAcknowledged)
            {
                throw new Exception("mongo failed to ack");
            }


            return await collection.Find(b => b.id == contractId).SingleAsync();

        }

        [HttpGet("salesOrder/completed/{escapedId}/{escapedTxId}")]
        public async Task<SalesOrderModel[]> salesCompleted(string escapedId, string escapedTxId)
        {
            var contractId = Uri.UnescapeDataString(escapedId);
            if (string.IsNullOrWhiteSpace(contractId))
                throw new ArgumentNullException(escapedId);

            var txId = Uri.UnescapeDataString(escapedTxId);
            if (string.IsNullOrWhiteSpace(txId))
                throw new ArgumentNullException(escapedTxId);

            var collection = _dbService.getCollection<SalesOrderModel>();

            var sales = await collection.Find(b => b.id == contractId).SingleAsync();

            var done = await collection.UpdateOneAsync(b => b.id == contractId,
                Builders<SalesOrderModel>.Update
                .Set(b => b.buyTx, txId));

            if (!done.IsAcknowledged)
            {
                throw new Exception("mongo failed to ack");
            }

            return await ordersByTrack(Uri.EscapeDataString(sales.details.trackId), contractId);
        }

        /// <summary>
        /// should be need Authorization??????
        /// in real we should look at the blokc cain ourselves
        /// </summary>
        /// <param name="bid"></param>
        /// <returns></returns>
        [HttpPost("salesOrder/{escapedId}")]
        public async Task<SalesOrderModel> registerSalesOrder(string escapedId, [FromBody] SalesOrderDetailsModel details)
        {
            var contractId = Uri.UnescapeDataString(escapedId);
            if (string.IsNullOrWhiteSpace(contractId))
                throw new ArgumentNullException(escapedId);

            //todo: check in the blockchain
            var collection = _dbService.getCollection<SalesOrderModel>();

            var done = await collection.UpdateOneAsync(b => b.id == contractId,
                Builders<SalesOrderModel>.Update
                .Set(b => b.details, details)
                .SetOnInsert(b => b.id, contractId),
                new UpdateOptions
                {
                    IsUpsert = true
                });

            if (!done.IsAcknowledged)
            {
                throw new Exception("mongo failed to ack");
            }


            return await collection.Find(b => b.id == contractId).SingleAsync();

        }



        [HttpPost("new/{escapedTrackId}")]
        public async Task<StoredTrackModel> registerNft(string escapedTrackId, [FromBody] NFTDetailsModel details)
        {
            var trackId = Uri.UnescapeDataString(escapedTrackId);
            if (string.IsNullOrWhiteSpace(trackId))
                throw new ArgumentNullException(escapedTrackId);

            if (null == details)
                throw new ArgumentNullException(nameof(details));

            //todo: check in the blockchain
            var collection = _dbService.getCollection<StoredTrackModel>().OfType<StoredTrackModel>();

            var done = await collection.UpdateOneAsync(t => t.id == trackId && null == t.nft,
                Builders<StoredTrackModel>.Update
                .Set(b => b.nft, details));

            if (done.ModifiedCount != 1)
            {
                throw new ExceptionWithCode("The track already had an NFT for it");
            }


            return await collection.Find(b => b.id == trackId).SingleAsync();

        }
    }
}
