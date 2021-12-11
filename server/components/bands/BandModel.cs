using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Driver;

namespace server.components.bands
{
    [BsonIgnoreExtraElements]
    [Utilities.MongoCollection("bands")]

    public class BandModel
    {
        [BsonId(IdGenerator = typeof(StringObjectIdGenerator))]
        [BsonRepresentation(BsonType.ObjectId)]
        public string id { get; set; }

        public string[] admins { get; set; }

        public BandDetailsModel details { get; set; }

        /// <summary>
        /// If true this band is aproved
        /// </summary>
        public bool approved { get; set; }
                

        [Utilities.MongoIndex]
        public static void CreateIndexes(IMongoCollection<BandModel> collection)
        {
            collection.Indexes.CreateOne(
                new CreateIndexModel<BandModel>(
                        new IndexKeysDefinitionBuilder<BandModel>().Ascending(f => f.details.slug),
                        new CreateIndexOptions() { Unique = true, Sparse = true }
                        )
                );
        }

    }
}
