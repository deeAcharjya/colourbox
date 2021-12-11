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
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Utilities;

namespace server.components.bands
{
    public class BandsConfig
    {
        /// <summary>
        /// Used in testnet to not need approvals
        /// </summary>
        public bool allIsApproved { get; set; } 
    }

    [ApiController]
    [Route("api/[controller]")]
    public class BandsController : ControllerBase
    {
        readonly Utilities.IDbService _dbService;
        readonly ILogger _logger;
        readonly BandsConfig _bandConfig;

        public BandsController(Utilities.IDbService db,
            IConfiguration config,
            ILogger<BandsController> logger)
        {
            _logger = logger;
            _dbService = db;
            _bandConfig = config.GetSection("bands").Get<BandsConfig>();
        }

        [HttpGet("{escapedId}")]
        public async Task<BandModel> getBand(string escapedId)
        {
            var id = Uri.UnescapeDataString(escapedId);

            var collection = _dbService.getCollection<BandModel>();

            var testNet = _bandConfig?.allIsApproved ?? false;

            var ret = await collection.Find(b => b.id == id).SingleAsync();

            if (testNet)
            {
                ret.approved = true;
            }

            return ret;

        }


        [HttpGet]
        public async Task<BandModel[]> list([FromQuery] string byAdmin = null)
        {

            var collection = _dbService.getCollection<BandModel>();

            var filter = Builders<BandModel>.Filter.Where(b => true);

            var testNet = _bandConfig?.allIsApproved ?? false;

            if (!string.IsNullOrWhiteSpace(byAdmin))
            {
                byAdmin = Uri.UnescapeDataString(byAdmin);

                _logger.LogDebug($"bands by admin Id {byAdmin}");

                filter = Builders<BandModel>.Filter.And(filter,
                        Builders<BandModel>.Filter.Where(b => b.admins.Contains(byAdmin)));

            }else if (!testNet)
            {
                filter = Builders<BandModel>.Filter.And(filter,
                        Builders<BandModel>.Filter.Where(b => b.approved ));
            }

            var ret = (await collection.Find(filter).Limit(50).ToListAsync()).ToArray();

            if (testNet)
            {
                foreach (var v in ret)
                    v.approved = true;
            }

            return ret;

        }


        [Authorize]
        [HttpPost("{escapedId}")]
        public async Task<BandModel> updateDetails(string escapedId, [FromBody] BandDetailsModel details)
        {
            var id = Uri.UnescapeDataString(escapedId);

            if (null == details)
                throw new ArgumentNullException(nameof(details));

            var collection = _dbService.getCollection<BandModel>();

            

            var userId = this.GetUserId();

            if("new" == id)
            {
                var testNet = _bandConfig?.allIsApproved ?? false;

                var newBand = new BandModel
                {
                    details = details,
                    admins = new[] { userId }
                };

                if (testNet)
                {
                    newBand.approved = true;
                }

                await collection.InsertOneAsync(newBand);
                return newBand;

            }
            else
            {
                var band = await collection.Find(b => b.id == id).SingleAsync();

                if (!band.admins.Contains(userId))
                {
                    throw new ExceptionWithCode("not admin", HttpStatusCode.Forbidden);
                }

                var done = await collection.UpdateOneAsync(b => b.id == id,
                    Builders<BandModel>.Update.Set(b => b.details, details));

                if (!done.IsAcknowledged)
                    throw new Exception("mongo failed to ack");

                return await collection.Find(b => b.id == id).SingleAsync();
            }
        }


    }
}
