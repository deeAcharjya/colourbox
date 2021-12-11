using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Utilities
{
    /// <summary>
    /// Used by front end to upload media to S3
    /// </summary>
    public class NewPageDirectModel
    {
        public StoredMediaModel media { get; set; }

        public string preSignedUrl { get; set; }

        public S3UploadOptionsModel options { get; set; }

        public static async Task<NewPageDirectModel> createNew(
                bool withPreSignedUrl,
                StoredMediaModel media, 
                IStorageProvider storage,
                IDbService db)
        {
            var ret = new NewPageDirectModel
            {
                media = media,
                preSignedUrl = withPreSignedUrl?await storage.createPresignedUrl(media.originalFile, true): storage.keyForDirectUpload(media.originalFile),
                options = new S3UploadOptionsModel
                {
                    awsRegion = storage.config.bucketRegion,
                    bucket= storage.config.bucketName,
                    aws_key = storage.config.accessKey,
                    aws_url= storage.config.customEndpoint,
                }
            };
        
            await db.getCollection<StoredMediaModel>().InsertOneAsync(ret.media);

            return ret;

        }
    }
}
