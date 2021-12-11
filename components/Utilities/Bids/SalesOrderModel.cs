using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Driver;
using System;

namespace Utilities.Bids
{
    [BsonIgnoreExtraElements]
    [Utilities.MongoCollection("salesOrders")]

    public class SalesOrderModel
    {
        [BsonRepresentation(BsonType.String)]
        public string id { get; set; }

        public SalesOrderDetailsModel details { get; set; }

        /// <summary>
        /// The Transaction that fulfils this
        /// </summary>
        [ExportAsOptional]
        public string buyTx { get; set; }


        [Utilities.MongoIndex]
        public static void CreateIndexes(IMongoCollection<SalesOrderModel> collection)
        {
            collection.Indexes.CreateOne(
                new CreateIndexModel<SalesOrderModel>(
                        new IndexKeysDefinitionBuilder<SalesOrderModel>().Ascending(f => f.details.trackId))
                );

            collection.Indexes.CreateOne(
                new CreateIndexModel<SalesOrderModel>(
                new IndexKeysDefinitionBuilder<SalesOrderModel>().Ascending(f => f.details.sellerAddress))
            );

        }


    }
}
