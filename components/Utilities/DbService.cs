using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace Utilities
{
    /// <summary>
    /// Keeps track of all DB config related stuff
    /// </summary>
    public interface IDbService
    {
        IMongoDatabase db { get; }
        IMongoCollection<T> getCollection<T>();
    }

    public class MongoConfig
    {
        public string connectionString { get; set; }
        public string dbname { get; set; } = "colourbox";
    }

    public class DbService : IDbService
    {
        readonly MongoClient _client;
        readonly IMongoDatabase _db;
        readonly ILogger _logger;

        public DbService(
            IConfiguration configuration,
            ILogger<DbService> logger
            )
        {
            _logger = logger;

            var config = configuration.GetSection("mongo").Get<MongoConfig>();


            var connectionString = config?.connectionString;

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                //mongodb://localhost:27019?connect=direct
                connectionString = "mongodb://mongodb?connect=direct";
            }

            _logger.LogDebug($"using mongo connection {connectionString}");
                

            _client = new MongoClient(connectionString);
            _db = _client.GetDatabase(config.dbname);
        }

        public IMongoDatabase db { get { return _db; } }

        public IMongoCollection<T> getCollection<T>()
        {
            CreateIndexes<T>();

            var attribute = typeof(T).GetCustomAttributes<MongoCollectionAttribute>( true).FirstOrDefault();

            if (string.IsNullOrWhiteSpace(attribute?.collectionName))
            {
                Debug.Assert(false);
                throw new Exception("MongoCollection not defined");
            }

            return db.GetCollection<T>(attribute.collectionName);
        }

        /// <summary>
        /// Used to create the Index the first time we create the db
        /// </summary>
        static ConcurrentDictionary<Type, bool> _indexesCreated = new ConcurrentDictionary<Type, bool>();

        void CreateIndexes<T>()
        {
            var theType = typeof(T);

            if (_indexesCreated.ContainsKey(theType))
                return;

            var allDone = theType.GetMethods(BindingFlags.Static)
                .Where(m => m.GetCustomAttributes<MongoIndexAttribute>(false).Count() > 0)
                .Select(m =>
                {
                    m.Invoke(null, new[] { this.getCollection<T>() });
                    return true;
                })
                .ToArray();
                ;

            /*
            chatItems.ChatMessageModel.CreateIndexes(_db);
            login.UserModel.CreateIndexes(_db);
            */

            _indexesCreated[theType] = true;
        }

    }

    /// <summary>
    /// defines what collection this Class is stored in
    /// </summary>
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = true)]
    public class MongoCollectionAttribute : Attribute
    {
        public string collectionName { get; private set; }
        public MongoCollectionAttribute(string collectionName)
        {
            this.collectionName = collectionName;
        }
    }

    /// <summary>
    /// This methods will be called to Create Indexes on the object
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = true,  Inherited = true)]
    public class MongoIndexAttribute : Attribute { }
}
