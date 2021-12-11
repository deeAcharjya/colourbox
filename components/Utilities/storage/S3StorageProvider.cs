using Amazon.Runtime.Internal.Util;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ILogger = Microsoft.Extensions.Logging.ILogger;
using Microsoft.Extensions.Logging;



namespace Utilities
{
    public class S3Config
    {
        public string accessKey { get; set; }
        public string bucketName { get; set; }
        public string bucketRegion { get; set; }
        public string secretKey { get; set; }

        /// <summary>
        /// where minio is hosted
        /// </summary>
        public string customEndpoint { get; set; }
        public bool usesHttp { get; set; }

        /// <summary>
        /// If ep exposed to the frontEnd is different from customEndpoint
        /// </summary>
        public string uploadLoadEndPoint { get; set; }

        public string downloadedStorageRoot { get; set; } = "/tmpStorage";

    }

    public struct StorageMediaDetails
    {
        /// <summary>
        /// The storage Key
        /// </summary>
        public string key { get; set; }

        /// <summary>
        /// Size in bytes
        /// </summary>
        public long size { get; set; }
    }

    public interface IStorageProvider
    {
        /// <summary>
        /// checks if the key exists, if keys ends with .* extension then check the extensions as well
        /// Throws notfound exception if not exists
        /// </summary>
        /// <param name="publicPathORImageId"></param>
        /// <returns></returns>
        Task<StorageMediaDetails> ensureMediaExistsAsync(string publicPathORImageId);


        /// <summary>
        /// searches media that starts with
        /// </summary>
        /// <param name="publicPathORImageId"></param>
        /// <returns></returns>
        Task<string[]> searchByPrefixAsync(string publicPathORImageId);


        /// <summary>
        /// create a presigned URL that can be GET with no other authorization
        /// </summary>
        /// <param name="publicPathORImageId"></param>
        /// <returns></returns>
        Task<string> createPresignedUrl(string publicPathORImageId, bool forUpload = false);

        /// <summary>
        /// Saves a stream and return it's public path
        /// </summary>
        /// <param name="imageId"></param>
        /// <param name="stm"></param>
        /// <returns></returns>
        Task<string> SaveStreamAsync(string imageId, Stream stm);

        /// <summary>
        /// return public path from a key
        /// </summary>
        /// <param name="imageId"></param>
        /// <returns></returns>
        string publicPath(string imageId);


        /// <summary>
        /// returns a Key that can be used for client side direct upload
        /// </summary>
        /// <param name="publicPathORImageId"></param>
        /// <returns></returns>
        string keyForDirectUpload(string publicPathORImageId);


        /// <summary>
        /// get the REV pageId from key used by the storage
        /// </summary>
        /// <param name="storageKey"></param>
        /// <returns></returns>
        string getImagedIdFromStorageKey(string storageKey);


        /// <summary>
        /// return key from public path
        /// </summary>
        /// <param name="publicPathORImageId"></param>
        /// <returns></returns>
        string getKey(string publicPathORImageId);


        /// <summary>
        /// Deeletes an image, input can be key or publicpath
        /// </summary>
        /// <param name="imageId"></param>
        /// <returns></returns>
        Task<String> DeleteAsync(string imageId);


        /// <summary>
        /// Remove all content for this storageroot
        /// </summary>
        /// <returns></returns>
        Task RemoveAllContentsAsync();



        Task<Stream> getImageStreamAsync(string imageId);

        Task<string> ensureLocalFileAsync(string imageId);


        S3Config config { get; }

    }

    public class S3StorageProvider: IStorageProvider
    {
        
        readonly ICacheProvider _cache;

        readonly string _storageRoot = "ne-storage";

        readonly ILogger _logger;


        public S3Config config { get; }

        public S3StorageProvider(IConfiguration Configuration,
            ICacheProvider cache,
            ILogger<S3StorageProvider> logger
            )
        {
            _logger = logger;
            config = Configuration.GetSection("s3Storage").Get<S3Config>();

            if (string.IsNullOrWhiteSpace(config?.bucketName))
                throw new Exception("S3  Storage not configured");

            _cache = cache;

            ensureLocalBucket();
        }

        static bool _localBucketChecked = false;
        void ensureLocalBucket()
        {
            if (_localBucketChecked)
                return;

            if (string.IsNullOrWhiteSpace(config.customEndpoint))
                return;

            if (string.IsNullOrWhiteSpace(config.bucketName))
                throw new Exception("s3 bucket name not configured");

            if (string.IsNullOrWhiteSpace(config.bucketRegion))
                throw new Exception("s3 bucketRegion name not configured");

            try
            {
                var minio = minioClient();

                if (!minio.BucketExistsAsync(config.bucketName).Result)
                {
                    minio.MakeBucketAsync(config.bucketName).Wait();
                    var policy = "{ \"Version\":\"2012-10-17\",\"Statement\":[{ \"Effect\":\"Allow\",\"Principal\":{ \"AWS\":[\"*\"]},\"Action\":[\"s3:GetBucketLocation\",\"s3:ListBucket\"],\"Resource\":[\"arn:aws:s3:::" + config.bucketName + "\"]},{ \"Effect\":\"Allow\",\"Principal\":{ \"AWS\":[\"*\"]},\"Action\":[\"s3:GetObject\"],\"Resource\":[\"arn:aws:s3:::" + config.bucketName + "/*\"]}]}";
                    minio.SetPolicyAsync(config.bucketName, policy /*PolicyType.READ_ONLY*/).Wait();

                }

            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.Assert(false, $"Failed to create local storage bucket {config.bucketName}. Please create manually");
                throw ex;
            }

            //we put it here after we have created new bucket if needed
            _localBucketChecked = true;
        }


        public async Task<string> ensureLocalFileAsync(string pageId)
        {
            var localFileName = Path.Join(config.downloadedStorageRoot, $"file_{pageId}");

            if (!File.Exists(localFileName))
            {
                var tmpFolder = Path.GetDirectoryName(localFileName);
                if (!Directory.Exists(tmpFolder))
                {
                    Directory.CreateDirectory(tmpFolder);
                }

                var pageStream = await getImageStreamAsync(pageId);
                using (var fileStream = File.Create(localFileName))
                {
                    pageStream.Seek(0, SeekOrigin.Begin);
                    await pageStream.CopyToAsync(fileStream);
                    fileStream.Close();
                }

            }

            return localFileName;

        }


        string pathPrefix
        {
            get
            {
                var ep = string.IsNullOrEmpty(config.customEndpoint) ?
                    $"http://{config.bucketName}.s3.amazonaws.com" : $"{config.customEndpoint}/{config.bucketName}";

                if (!string.IsNullOrWhiteSpace(_storageRoot))
                {
                    ep = $"{ep}/{_storageRoot}";
                }

                return ep;

            }
        }

        public string keyForDirectUpload(string publicPathOrKey)
        {
            return (string.IsNullOrWhiteSpace(_storageRoot) ? "" : $"{ _storageRoot}/") + getKey(publicPathOrKey);
        }

        /// <summary>
        /// get the REV page id from storage absolute key
        /// </summary>
        /// <param name="storageKey"></param>
        /// <returns></returns>
        public string getImagedIdFromStorageKey(string storageKey)
        {
            if (!storageKey.StartsWith(_storageRoot))
                throw new Exception($"not a valid storage key :{storageKey}");

            return storageKey.Replace(_storageRoot + "/", "");
        }

        /// <summary>
        /// return the storageKey from public path or key
        /// </summary>
        /// <param name="publicPathORkey"></param>
        /// <returns></returns>
        public string getKey(string publicPathORkey)
        {
            var key = publicPathORkey;
            if (key.StartsWith(pathPrefix))
                key = key.Replace(pathPrefix, "");

            return key;
        }

        public string publicPath(string key)
        {
            return $"{pathPrefix}/{key}";
        }

        public async Task<string[]> searchByPrefixAsync(string publicPathORkey)
        {
            var key = getKey(publicPathORkey);
            using (var s3Client = createS3Client())
            {
                var resolvedName = getStorageKey(key);

                var found = await s3Client.ListObjectsAsync(config.bucketName, resolvedName);

                return found.S3Objects.Select(k => getImagedIdFromStorageKey(k.Key)).ToArray();

            }
        }


        public async Task<StorageMediaDetails> ensureMediaExistsAsync(string publicPathORkey)
        {
            var key = getKey(publicPathORkey);
            using (var s3Client = createS3Client())
            {
                var resolvedName = getStorageKey(key);

                if (key.EndsWith(".*"))
                {
                    resolvedName = resolvedName.Remove(resolvedName.Length - 2);
                }

                var found = await s3Client.ListObjectsAsync(config.bucketName, resolvedName);

                if (found.S3Objects.Count() == 0)
                    throw new ExceptionWithCode($"media key {publicPathORkey} not found");

                var foundObject = found.S3Objects.First();
                var foundKey = key;

                if (key.EndsWith(".*"))
                {
                    var foundExt = System.IO.Path.GetExtension(foundObject.Key).TrimStart('.');
                    foundKey = key.Remove(key.Length - 2) + "." + foundExt;
                }

                return new StorageMediaDetails
                {
                    key = foundKey,
                    size = foundObject.Size
                };

            }
        }

        Amazon.S3.AmazonS3Client createS3Client()
        {
            var awsRegion = Amazon.RegionEndpoint.GetBySystemName(config.bucketRegion);

            if (string.IsNullOrWhiteSpace(config.customEndpoint))
            {
                return new Amazon.S3.AmazonS3Client(config.accessKey, config.secretKey, awsRegion);
            }
            else
            {
                var r = new Amazon.S3.AmazonS3Config
                {
                    RegionEndpoint = awsRegion,
                    ServiceURL = config.customEndpoint,
                    ForcePathStyle = true
                };

                if (!string.IsNullOrWhiteSpace(config.uploadLoadEndPoint))
                    r.ServiceURL = config.uploadLoadEndPoint;


                return new Amazon.S3.AmazonS3Client(config.accessKey, config.secretKey, r);
            }

        }

        
        public async Task<string> createPresignedUrl(string publicPathORkey, bool forUpload = false)
        {
            var key = getKey(publicPathORkey);
            var keytoSign = getStorageKey(key);


            if (string.IsNullOrWhiteSpace(config.customEndpoint))
            {
                using (var s3Client = createS3Client())
                {
                    var request1 = new GetPreSignedUrlRequest
                    {
                        BucketName = config.bucketName,
                        Key = keytoSign,
                        Expires = DateTime.Now.AddMinutes(forUpload ? 60 : 5),
                        Verb = forUpload ? Amazon.S3.HttpVerb.PUT : Amazon.S3.HttpVerb.GET,
                    };

                    if (config.usesHttp)
                        request1.Protocol = Amazon.S3.Protocol.HTTP;

                    var ret = s3Client.GetPreSignedURL(request1);
                    return ret;

                }


            }
            else
            {

                var minio = minioClient();

                if (forUpload)
                    return await minio.PresignedPutObjectAsync(config.bucketName, keytoSign, 60);
                else
                    return await minio.PresignedGetObjectAsync(config.bucketName, keytoSign, 5);
            }



        }

        Minio.MinioClient minioClient()
        {
            if (string.IsNullOrEmpty(config.customEndpoint))
                throw new Exception("not using minio");

            var ep = config.customEndpoint.Replace("http://", "").Replace("https://", "");
            return new Minio.MinioClient(ep, config.accessKey, config.secretKey, config.bucketRegion);

        }


        public async Task<Stream> getImageStreamAsync(string publicpath)
        {
            var key = getKey(publicpath);

            using (var s3Client = createS3Client())
            using (var response = await s3Client.GetObjectAsync(new GetObjectRequest
            {
                BucketName = config.bucketName,
                Key = getStorageKey(key)
            }))
            {
                //the ResponseStream closes when response is disposed to we need to cache it
                var imageStream = _cache.createCacheStream();
                response.ResponseStream.CopyTo(imageStream);


                return imageStream;
            }

        }

        public async Task RemoveAllContentsAsync()
        {
            var request = new ListObjectsRequest
            {
                BucketName = config.bucketName,
                Prefix = _storageRoot
            };
            using (var s3Client = createS3Client())
            {
                while (request != null)
                {
                    var response = await s3Client.ListObjectsAsync(request);


                    if (response.S3Objects.Count() > 0)
                    {

                        var deleteResponse = await s3Client.DeleteObjectsAsync(new DeleteObjectsRequest
                        {
                            BucketName = config.bucketName,
                            Objects = response.S3Objects.Select(o => new KeyVersion { Key = o.Key }).ToList()
                        });
                    }

                    //we do the length checck cause if s3 is actiing bad we don't want to go in an infinite loop
                    if (response.S3Objects.Count() > 0 && response.IsTruncated)
                    {
                        request.Marker = response.NextMarker;
                    }
                    else
                    {
                        request = null;
                    }
                };
            }
        }

        public async Task<String> DeleteAsync(string publicpath)
        {
            var key = getKey(publicpath);

            using (var s3Client = createS3Client())
            {
                await s3Client.DeleteObjectAsync(config.bucketName, getStorageKey(key));
            }

            return key;

        }

        string getStorageKey(string appKey)
        {
            if (!String.IsNullOrWhiteSpace(_storageRoot))
                appKey = $"{_storageRoot}/{appKey}";

            return appKey;
        }

        public static async Task savetoS3withRetry(ILogger logger, AmazonS3Client s3Client, ICacheProvider cache, Stream inStm, string key, string bucket)
        {
            Exception lastEx = null;

            for (var i = 0; i < 3; i++)
            {
                using (var stm = cache.createCacheStream())
                {
                    if (inStm.Position != 0 && inStm.CanSeek)
                    {
                        inStm.Seek(0, SeekOrigin.Begin);
                    }
                    await inStm.CopyToAsync(stm);

                    if (i > 0)
                    {
                        logger?.LogInformation($"retrying to save key {key}. -> retry {i}");

                        try
                        {
                            await s3Client.DeleteObjectAsync(new DeleteObjectRequest
                            {
                                Key = key,
                                BucketName = bucket,

                            });
                        }
                        catch (Exception ex)
                        {
                            logger?.LogInformation($"Failed to delete key {key}. -> retry {i}: {ex}");
                        }


                    }


                    try
                    {
                        if (stm.Position != 0 && stm.CanSeek)
                        {
                            stm.Seek(0, SeekOrigin.Begin);
                        }
                    }
                    catch (Exception ex)
                    {
                        throw ex;
                    }


                    try
                    {
                        await s3Client.PutObjectAsync(new PutObjectRequest
                        {
                            InputStream = stm,
                            Key = key,
                            BucketName = bucket,
                            CannedACL = /*_publicReadable ? Amazon.S3.S3CannedACL.PublicRead :*/ Amazon.S3.S3CannedACL.Private
                        });

                        return;
                    }
                    catch (Exception ex)
                    {
                        lastEx = ex;
                        logger?.LogWarning($"Failed to save stream to key {key}, try : {i},  Ex : {lastEx}");

                        await Task.Delay(TimeSpan.FromSeconds((i + 5)));
                    }
                }
            }

            if (null != lastEx)
            {
                logger?.LogError($"Failed to save stream to key {key}, Ex : {lastEx}");
                throw lastEx;
            }


        }

        public async Task<string> SaveStreamAsync(string key, Stream stm)
        {
            Stream cacheStm = null;
            try
            {
                cacheStm = _cache.createCacheStream();
                await stm.CopyToAsync(cacheStm);

                using (var s3Client = createS3Client())
                {
                    await savetoS3withRetry(null, s3Client, _cache, cacheStm, getStorageKey(key), config.bucketName);

                    return publicPath(key);
                }
            }
            finally
            {
                if (null != cacheStm)
                    cacheStm.Dispose();
            }
        }
    }





}

