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

    public class ImagesController : MediaController<StoredImageModel>
    {
        public ImagesController(Utilities.IDbService db,
            IStorageProvider storage,
            ILogger<ImagesController> logger):base(db,storage,logger)
        {
        }

        [Authorize]
        [HttpGet("uploadUrl/{ext}")]
        public async Task<NewPageDirectModel> getDirectUpload(string ext, [FromQuery] bool preSigned = false)
        {
            return await getDirectUploadUrl(new StoredImageModel(), ext, preSigned);
        }

    }

    


    public abstract class MediaController<T> : ControllerBase where T : StoredMediaModel
    {
        protected readonly IDbService _dbService;
        protected readonly IStorageProvider _storage;
        protected readonly ILogger _logger;

        public MediaController(Utilities.IDbService db,
            IStorageProvider storage,
            ILogger logger)
        {
            _logger = logger;
            _dbService = db;
            _storage = storage;
        }

        protected async Task<NewPageDirectModel> getDirectUploadUrl(T stored, string ext, bool preSigned)
        {
            
            stored.Initialize(this.GetUserId(), ext);

            return await NewPageDirectModel.createNew(preSigned,stored, _storage, _dbService);
        }

        /// <summary>
        /// Gets a maps of ImagePaths from Ids
        /// </summary>
        /// <param name="imageIds"></param>
        /// <returns></returns>
        [HttpPost("publicPaths")]
        public async Task<Dictionary<string, MediaDisplayModel>> publicPaths(string[] imageIds)
        {
            var collection = _dbService.getCollection<T>().OfType<T>();

            return (await collection.Find(im => imageIds.Contains(im.id)).ToListAsync())
                    .ToDictionary(k=>k.id,v=> new MediaDisplayModel{
                            publicPath= _storage.publicPath(v.publicFile()),
                            data = v
                        });
        }

    }
}
