using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Driver;
using System;

namespace Utilities
{
    /// <summary>
    /// base class for all media that has been stored on S3
    /// </summary>
    /// 
    [BsonIgnoreExtraElements]
    [BsonDiscriminator(RootClass = true)]
    [BsonKnownTypes(typeof(StoredImageModel), typeof(StoredTrackModel))]
    [Utilities.MongoCollection("storedMedia")]

    public abstract class StoredMediaModel
    {
        [BsonRepresentation(BsonType.String)]
        public string id { get; set; }

        /// <summary>
        /// The user that uploaded this
        /// </summary>
        public string userId { get; set; }

        public string ext { get; set; }

        public string storageFolder { get; set; }

        public string originalFile { get; set; }

        public DateTime created { get; set; }

        /// <summary>
        /// Used to get the file that will be used to show in frontEnd
        /// </summary>
        /// <param name="props"></param>
        /// <returns></returns>
        public virtual string publicFile(string[] props = null)
        {
            return originalFile;
        }


        /// <summary>
        /// constructor for serialization
        /// </summary>
        public StoredMediaModel() { }

        public void Initialize(string userId, string ext)
        {

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentNullException(nameof(userId));
            }

            if (string.IsNullOrWhiteSpace(ext))
            {
                throw new ArgumentNullException(nameof(ext));
            }

            this.created = DateTime.Now;

            this.userId = userId;            
            this.id = Guid.NewGuid().ToString();
            this.ext = ext.TrimStart('.');
            this.storageFolder = $"{userId}/{this.ext}/{this.created.ToString($"yyyy-MM-dd-HH")}-{this.id}";
            this.originalFile = $"{storageFolder}/original.{this.ext}";
        }
    }
}
