using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NBitcoin;
using server.components.login;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;
using MongoDB.Driver;
using System.Threading.Tasks;
using System;
using System.Linq;

using System.Security.Cryptography;
using System.IO;
using System.Text;
using MoreLinq;
using Nethereum.HdWallet;
using Nethereum.Web3.Accounts;

namespace Utilities
{
    /// <summary>
    /// Used to save generated wallet in mongoDb
    /// </summary>
    [BsonIgnoreExtraElements]
    [Utilities.MongoCollection("custodialWallets")]
    public class GeneratedWallet
    {
        [BsonId]
        [BsonRepresentation(BsonType.Int32)]
        public int id { get; set; }

        public string address { get; set; }

        /// <summary>
        /// The private key encrypted with login::privatekey
        /// </summary>
        public string encryptedKey { get; set; }

        /// <summary>
        /// this wallet has been assigned to something
        /// </summary>
        public string usedBy { get; set; }

        [MongoIndex]
        public static void CreateIndexes(IMongoCollection<GeneratedWallet> collection)
        {
            collection.Indexes.CreateOne(
                new CreateIndexModel<GeneratedWallet>(
                        new IndexKeysDefinitionBuilder<GeneratedWallet>().Ascending(f => f.usedBy),
                        new CreateIndexOptions() { Unique = true, Sparse = true }
                        )
                );
        }

        public Account getAccount(string privatekey, System.Numerics.BigInteger? chain = null)
        {
            var prKey = decrypt(privatekey, encryptedKey);

            return new Account(prKey, chain);
        }

        public static string decrypt(string privatekey, string encrypted)
        {
            byte[] iv = new byte[16];
            byte[] buffer = Convert.FromBase64String(encrypted);

            using (var aes = fromprivateKey(privatekey))
            {
                ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

                using (MemoryStream memoryStream = new MemoryStream(buffer))
                {
                    using (CryptoStream cryptoStream = new CryptoStream((Stream)memoryStream, decryptor, CryptoStreamMode.Read))
                    {
                        using (StreamReader streamReader = new StreamReader((Stream)cryptoStream))
                        {
                            return streamReader.ReadToEnd();

                            
                        }
                    }
                }
            }

        }

        static Aes fromprivateKey(string privatekey)
        {
            var aes = Aes.Create();
            aes.IV = new byte[16];

            aes.Key = new MD5CryptoServiceProvider().ComputeHash(Encoding.UTF8.GetBytes(privatekey));

            return aes;
        }

        public static string  encrypt(string plaintext, string privatekey)
        {

            byte[] array;

            using (var aes = fromprivateKey(privatekey))
            {
                ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

                using (MemoryStream memoryStream = new MemoryStream())
                {
                    using (CryptoStream cryptoStream = new CryptoStream((Stream)memoryStream, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter streamWriter = new StreamWriter((Stream)cryptoStream))
                        {
                            streamWriter.Write(plaintext);
                        }

                        array = memoryStream.ToArray();
                    }
                }
            }

            return Convert.ToBase64String(array);
        }

        public void setEncryptedKey(Account acc, string privatekey)
        {
            
            encryptedKey = encrypt(acc.PrivateKey, privatekey);
        }
    }


    public class WalletService
    {
        readonly IDbService _dbService;
        readonly ILogger _logger;
        readonly string _privateKey;
        readonly IConfiguration _config;


        public WalletService(Utilities.IDbService db,
            IConfiguration config,
            ILogger<WalletService> logger)
        {
            _logger = logger;
            _dbService = db;
            _privateKey = AuthConfig.createFromConfig(config).privateKey;
            _config = config;
        }

        public readonly static string wallet_Deployment = "wallet_Deployment";

        public async Task<Account> getAccount(string useKey, string chainId = null)
        {
            if (string.IsNullOrWhiteSpace(useKey))
                throw new ArgumentNullException(useKey);

            var collection = _dbService.getCollection<GeneratedWallet>();

            var wallet = await collection.Find(w => w.usedBy == useKey).SingleOrDefaultAsync();
            
            if(null == wallet)
            {
                var done = await collection.UpdateOneAsync(w => null == w.usedBy,
                            Builders<GeneratedWallet>.Update.Set(w=>w.usedBy,useKey));

                if(1 != done.ModifiedCount)
                {
                    _logger.LogCritical("we have run out of wallets");
                    throw new Exception("we have run out of wallets");
                }

                _logger.LogInformation($"assigned a wallet  to use {useKey}");

                return await getAccount(useKey, chainId);
            }



            return null == chainId ? wallet.getAccount(_privateKey):wallet.getAccount(_privateKey,  new System.Numerics.BigInteger(int.Parse(chainId)));

        }


        public void generateMemonic()
        {
            var mnemo = new Mnemonic(Wordlist.English, WordCount.Twelve);

            _logger.LogInformation($"generated mneno = {mnemo}");
        }

        /// <summary>
        /// called from cli to test if we have right memonic and password
        /// cb-cli /command verifywallets /mnemo "dssds dsdsd dsds sdds"   /password skjskjskjskjskjskjs
        /// </summary>
        public async Task verifyWallets()
        {
            var mnemo = _config.GetValue<string>("mnemo");

            var password = _config.GetValue<string>("password");

            if (string.IsNullOrWhiteSpace(mnemo))
                throw new ArgumentNullException(nameof(mnemo));

            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentNullException(nameof(password));

            var collection = _dbService.getCollection<GeneratedWallet>();

            var currentcount = (int)(await collection.CountDocumentsAsync(w => true));

            if (currentcount == 0)
            {
                throw new Exception("There are no wallets in database");
            }

            var wallet = new Wallet(mnemo.ToString(), password);

            

            foreach(var batch in Enumerable.Range(0, currentcount).Batch(100))
                
            {
                var wallets = await collection.Find(w => batch.Contains(w.id)).ToListAsync();

                var errors =   wallets.Select(w =>
                {
                    var account = wallet.GetAccount(w.id);

                    var walletAcount = w.getAccount(_privateKey);

                    if (account.Address != w.address)
                    {
                        return $"wallet {w.id} address does not match";
                    }

                    if (account.Address != walletAcount.Address)
                    {
                        return $"wallet account {w.id} address does not match";
                    }


                    if (account.PrivateKey != walletAcount.PrivateKey)
                    {
                        return $"wallet account {w.id} private key does not match";
                    }

                    return null;
                }).Where(e => null != e).ToArray();

                if(errors.Length > 0)
                {
                    throw new Exception($"we got memonic problem {errors[0]}");
                }

                _logger.LogInformation("all accounts verified");

                
            };

        }




        /// <summary>
        /// called from cli to create 
        /// cb-cli /command createwallets /mnemo "dssds dsdsd dsds sdds"  /count 10 /password skjskjskjskjskjskjs
        /// </summary>
        public async Task createWallets()
        {
            var mnemo = _config.GetValue<string>("mnemo");
            var count = _config.GetValue<int>("count");
            var password = _config.GetValue<string>("password");

            if (0 == count)
                throw new ArgumentNullException(nameof(count));

            if (string.IsNullOrWhiteSpace(mnemo))
                throw new ArgumentNullException(nameof(mnemo));

            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentNullException(nameof(password));

            var collection = _dbService.getCollection<GeneratedWallet>();

            var currentcount = (int)(await collection.CountDocumentsAsync(w => true));

            var wallet = new Wallet(mnemo, password);

            if (currentcount >0)
            {
                _logger.LogInformation("there are wallets. We will verify that the memonic is correct ");

                var firstWallet = await collection.Find(w => w.id == 0).SingleAsync();

                if(firstWallet.address != wallet.GetAccount(0).Address)
                {
                    throw new Exception("memonic or password is incorrect");
                }
            }

            var toInsert = Enumerable.Range(currentcount, count).Select(n =>
            {
                var account = wallet.GetAccount(n);
                var generatedWallet = new GeneratedWallet
                {
                    id = n,
                    address = account.Address
                };

                generatedWallet.setEncryptedKey(account, _privateKey);

                return new InsertOneModel<GeneratedWallet>(generatedWallet);
            }).ToArray();

            var done = await collection.BulkWriteAsync(toInsert);

            if (done.InsertedCount != toInsert.Length)
            {
                throw new Exception("we didn't insert everything check the database");
            }

            _logger.LogInformation($"created {done.InsertedCount} wallets");

        }


    }
}
