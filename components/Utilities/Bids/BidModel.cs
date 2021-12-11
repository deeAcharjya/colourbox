using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Driver;
using System;

namespace Utilities.Bids
{
    [BsonIgnoreExtraElements]
    [Utilities.MongoCollection("bids")]

    public class BidModel
    {
        ///Not sure how much data we want to keep in the server for now
        ///
        [BsonRepresentation(BsonType.String)]
        public string id{ get; set; }

        public BidDetailsModel details { get; set; }


        [Utilities.MongoIndex]
        public static void CreateIndexes(IMongoCollection<BidModel> collection)
        {
            collection.Indexes.CreateOne(
                new CreateIndexModel<BidModel>(
                        new IndexKeysDefinitionBuilder<BidModel>().Ascending(f => f.details.baseUrl))
                );

            collection.Indexes.CreateOne(
                new CreateIndexModel<BidModel>(
                new IndexKeysDefinitionBuilder<BidModel>().Ascending(f => f.details.bidderAddress))
            );

        }


    }
}
