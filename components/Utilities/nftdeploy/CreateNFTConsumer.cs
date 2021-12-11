using Automatonymous;
using MassTransit;
using MassTransit.Saga;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Utilities;
using System.Security.Cryptography;
using System.Collections.Concurrent;
using Nethereum.Web3;
using Newtonsoft.Json;
using Nethereum.Web3.Accounts;



namespace Utilities.nftdeploy
{
    public class CreateNFT
    {
        public ColorTrackDeployModel order { get; set; }
    }

    public class NFTCreated
    {
        public ColorTrackDeployModel order { get; set; }
    }

    public class Web3Config
    {
        
        public Dictionary<string, ChainInfoModel> chainInfo { get; set; }
        
        /// <summary>
        /// deployed address of CBfactory contract
        /// </summary>
        public string cbFactory { get; set; }

        /// <summary>
        /// deployed address of salesBook
        /// </summary>
        public string salesBook { get; set; }

        /// <summary>
        /// deployed address of BidMaker contract
        /// </summary>
        public string bidMaker { get; set; }

        /// <summary>
        /// The base URL used for creating NFTs
        /// </summary>
        public string nftBaseUrl { get; set; }


        
    }



    public class CreateNFTConsumer : IConsumer<CreateNFT>
    {

        readonly IDbService _dbService;
        readonly ILogger _logger;
        readonly Web3Config _web3Config;
        readonly WalletService _wallet;

        public CreateNFTConsumer(Utilities.IDbService db,
            IConfiguration _config,
            WalletService wallet,
            ILogger<CreateNFTConsumer> logger)
        {
            _logger = logger;
            _dbService = db;
            _wallet = wallet;

            _web3Config = _config.GetSection("web3").Get<Web3Config>();
        }

        

        public async Task Consume(ConsumeContext<CreateNFT> context)
        {
            try
            {


                if (string.IsNullOrWhiteSpace(context.Message.order.Minter))
                    throw new ArgumentNullException(nameof(context.Message.order.Minter));
                if (string.IsNullOrWhiteSpace(context.Message.order?.trackId))
                    throw new ArgumentNullException(nameof(context.Message.order.trackId));

                var collection = _dbService.getCollection<StoredTrackModel>().OfType<StoredTrackModel>();

                var track = await collection.Find(t => t.id == context.Message.order.trackId).SingleAsync();

                if (null != track.nft.clonetxId)
                {
                    throw new InvalidOperationException("there is already an NFT for this track");
                }

                if (null == track.calculatedDetails)
                {
                    throw new InvalidOperationException("there is not yet processed");
                }

                //avg song is 4 in = 240 sec = 240 * 10 = 2400 NFts
                var nftCount = track.calculatedDetails.durationInSeconds() * 10;

                var forSale = (int)Math.Ceiling(context.Message.order.salePercent * nftCount / 100.00);

                //var account = new Account(_pkeyhash[hash], _myConfig.chainId);
                if (!_web3Config.chainInfo.ContainsKey(context.Message.order.chainId))
                {
                    throw new NotSupportedException($"chainId {context.Message.order.chainId} not supported");
                }

                var chainInfo = _web3Config.chainInfo[context.Message.order.chainId];

                var web3 = new Web3(await _wallet.getAccount(WalletService.wallet_Deployment,
                                 context.Message.order.chainId),
                   chainInfo.rpcProvider
                   );


                var cbfactory = new CbFactory.CbFactoryService(web3, _web3Config.cbFactory);

                byte[] salt;
                using (var sha256Hash = SHA256.Create())
                {
                    salt = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(Guid.NewGuid().ToString()));
                }


                var owenr = await cbfactory.OwnerQueryAsync();

                var trackUri = $"{_web3Config.nftBaseUrl}/{track.id}";

                var newaddress = await cbfactory.GetCbTrackAddressQueryAsync(trackUri);

                var txId = await cbfactory.CreateTrackRequestAsync(minter: context.Message.order.Minter,
                    count: nftCount,
                    forSaleBegin: 0,
                    forSaleEnd: forSale,
                    baseUri: trackUri);

                var done = await collection.UpdateOneAsync(t => t.id == context.Message.order.trackId,
                    Builders<StoredTrackModel>.Update
                    .Set(t => t.nft.clonetxId, txId)
                    .Set(t=>t.nft.contractAddress,newaddress)
                    );

                if (!done.IsAcknowledged)
                {
                    var log = $"We have created an NFT but failed to update MONGO. Needs manual intervention ,clonetxId: {txId}, order:  {JsonConvert.SerializeObject(context.Message.order)} ";
                    _logger.LogCritical(log);
                    throw new InvalidOperationException(log);
                }

                /*
                var cloneDone = await web3.Eth.TransactionManager.TransactionReceiptService.PollForReceiptAsync(txId);

                var cbTrack = new ColorTrackClonable.ColorTrackClonableService(web3, newaddress);

                var initDone = await cbTrack.InitializeRequestAndWaitForReceiptAsync(
                    
                );
                */

                await context.RespondAsync(new NFTCreated { order = context.Message.order });
            }
            catch(Exception ex)
            {
                _logger.LogError($"failed to create NFT :{ex}");
                throw ex;
            }
        }
    }
}
