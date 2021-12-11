using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
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
using Utilities;

namespace server.components.media
{
    [ApiController]
    [Route("api/[controller]")]

    public class TracksController : MediaController<StoredTrackModel>
    {
        readonly IPublishEndpoint _publishEndpoint;
        readonly WalletService _wallet;

        public TracksController(IDbService db,
            IStorageProvider storage,
            WalletService wallet,
            IPublishEndpoint publishEndpoint,
            ILogger<ImagesController> logger) : base(db, storage, logger)
        {
            _publishEndpoint = publishEndpoint;
            _wallet = wallet;
        }

        async Task ensureBandAdmin(string bandId)
        {
            var band = await _dbService.getCollection<bands.BandModel>().Find(b => b.id == bandId).SingleAsync();

            if (!band.admins.Contains(this.GetUserId()))
            {
                throw new ExceptionWithCode("not band admin", HttpStatusCode.Forbidden);
            }

        }

        /// <summary>
        /// map of public paths and Stored Tracks
        /// </summary>
        [HttpGet("search/{escapedBandId}")]
        public async Task<TrackDisplayModel[]> getTracks(string escapedBandId)
        {
            var bandId = Uri.UnescapeDataString(escapedBandId);

            return (await _dbService.getCollection<StoredTrackModel>().OfType<StoredTrackModel>()
                .Find(t => t.bandId == bandId && t.details != null).ToListAsync())
                .Select(t => new TrackDisplayModel(t, _storage))
                .ToArray();
                

        }

        


        /// <summary>
        /// map of public paths and Stored Tracks
        /// </summary>
        [HttpGet("details/{escapedTrackId}")]
        public async Task<TrackDisplayModel> getTrackDetails(string escapedTrackId)
        {
            var trackId = Uri.UnescapeDataString(escapedTrackId);

            return new TrackDisplayModel( await _dbService.getCollection<StoredTrackModel>().OfType<StoredTrackModel>()
                .Find(t => t.id == trackId).SingleAsync(), _storage);
        }


        [Authorize]
        [HttpGet("uploadUrl/{bandId}/{ext}")]
        public async Task<NewPageDirectModel> getDirectUpload(string bandId, string ext)
        {
            await ensureBandAdmin(bandId);

            var track = new StoredTrackModel
            {
                bandId = bandId,
            };

            return await getDirectUploadUrl(track, ext, false);
        }

        [Authorize]
        [HttpPost("createNFT")]
        public async Task<string> createNFT([FromBody] Utilities.nftdeploy.ColorTrackDeployModel toDeploy)
        {
            if (string.IsNullOrWhiteSpace(toDeploy?.trackId))
                throw new ArgumentNullException(nameof(toDeploy.trackId));


            var collection = _dbService.getCollection<StoredTrackModel>().OfType<StoredTrackModel>();

            var track = await collection.Find(t => t.id == toDeploy.trackId).SingleAsync();

            await ensureBandAdmin(track.bandId);

            if (null != track.nft)
            {
                throw new InvalidOperationException("NFT creation has been triggered for this track");
            }

            if (string.IsNullOrWhiteSpace(toDeploy.Minter))
            {
                _logger.LogInformation("no minter provided. we mint using custodail account");
                
                var userId = this.GetUserId();
                var usercollection = _dbService.getCollection<login.UserModel>();

                var currentUser = await usercollection.Find(u => u.id == userId).SingleAsync();

                var custodialWallet = null == currentUser.wallets ? null : currentUser.wallets.Where(w => w.isCustodial).FirstOrDefault();

                if(null == custodialWallet)
                {
                    _logger.LogInformation($"creating custodial wallet for user {userId}");
                    var account = await _wallet.getAccount($"user_custodial_{userId}", toDeploy.chainId);

                    custodialWallet = new login.UserWalletModel
                    {
                        address = account.Address,
                        isCustodial = true
                    };

                    var walletAdded = await usercollection.UpdateOneAsync(u => u.id == userId && null == u.wallets,
                        Builders<login.UserModel>.Update.Set(u=>u.wallets, new [] { custodialWallet }));

                    if(walletAdded.ModifiedCount != 1)
                    {
                        _logger.LogDebug($"wallets exists for user {userId} push it");
                    }

                    walletAdded = await usercollection.UpdateOneAsync(u => u.id == userId ,
                        Builders<login.UserModel>.Update.Push(u => u.wallets,  custodialWallet ));

                    if(walletAdded.ModifiedCount != 1)
                    {
                        throw new Exception("failed to add wallet to user db");
                    }
                }

                toDeploy.Minter = custodialWallet.address;
            }


            var nft = new NFTDetailsModel
            {
                sagaId = Guid.NewGuid(),
                chainId = toDeploy.chainId
            };

            toDeploy.CorrelationId = nft.sagaId;

            await _publishEndpoint.Publish(toDeploy);

            var done = await collection.UpdateOneAsync(t => t.id == toDeploy.trackId,
                Builders<StoredTrackModel>.Update.Set(t => t.nft, nft));

            if (!done.IsAcknowledged)
                throw new Exception("mong failed to ack");

            return toDeploy.CorrelationId.ToString();
        }

        [Authorize]
        [HttpPost("details/{escapedTrackId}")]
        public async Task<StoredTrackModel> updateDetails(string escapedTrackId, [FromBody] TrackDetailsModel details)
        {
            var trackId = Uri.UnescapeDataString(escapedTrackId);

            if (null == details)
                throw new ArgumentNullException(nameof(details));

            var collection = _dbService.getCollection<StoredTrackModel>().OfType<StoredTrackModel>();
            var existing= await collection.Find(t => t.id == trackId).SingleAsync();

            await ensureBandAdmin(existing.bandId);

            if(null == existing.details)
            {
                _logger.LogInformation($"track {trackId} is being submited");
                await _publishEndpoint.Publish(new TrackSumbitted
                {
                    trackId = trackId
                });
            }

            var done = collection.UpdateOneAsync(t => t.id == trackId,
                Builders<StoredTrackModel>.Update.Set(t => t.details, details));

            return await collection.Find(t => t.id == trackId).SingleAsync();
        }

    }
}
