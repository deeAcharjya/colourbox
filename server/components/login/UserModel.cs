using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Driver;

namespace server.components.login
{
    /// <summary>
    /// Represents a User in the system
    /// </summary>
    [BsonIgnoreExtraElements]
    [Utilities.MongoCollection("users")]
    public class UserModel
    {
        [BsonId(IdGenerator = typeof(StringObjectIdGenerator))]
        [BsonRepresentation(BsonType.ObjectId)]
        public string id { get; set; }

        public UserDetailsModel details { get; set; }

        public UserWalletModel[] wallets { get; set; }

        [Utilities.MongoIndex]
        public static void CreateIndexes(IMongoCollection<UserModel> collection)
        {
            collection.Indexes.CreateOne(
                new CreateIndexModel<UserModel>(
                        new IndexKeysDefinitionBuilder<UserModel>().Ascending(f => f.details.phoneNumber),
                        new CreateIndexOptions() { Unique = true, Sparse = true }
                        )
                );

            collection.Indexes.CreateOne(
                new CreateIndexModel<UserModel>(
                new IndexKeysDefinitionBuilder<UserModel>().Ascending(f => f.details.primaryEmail),
                new CreateIndexOptions() { Unique = true, Sparse = true }
                )
            );

            collection.Indexes.CreateOne(
                new CreateIndexModel<UserModel>(
                new IndexKeysDefinitionBuilder<UserModel>().Ascending(f => f.details.web3Wallets),
                new CreateIndexOptions() { Unique = true, Sparse = true }
                )
        );


        }


    }
}
