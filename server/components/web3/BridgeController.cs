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
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Utilities;
using WalletConnectSharp.Core;
using WalletConnectSharp.Core.Models;
using System.Security.Cryptography;
using System.Collections.Concurrent;
using WalletConnectSharp.Core.Network;
using WalletConnectSharp.Desktop;

namespace server.components.web3
{
    [ApiController]
    [Route("api/[controller]")]
    public class BridgeController : ControllerBase
    {

        readonly Utilities.IDbService _dbService;
        readonly ILogger _logger;

        public BridgeController(Utilities.IDbService db,
            ILogger<BridgeController> logger)
        {
            _logger = logger;
            _dbService = db;
        }


        string sessionToken(string txId)
        {
            var usrId = this.GetUserId();
            if (string.IsNullOrWhiteSpace(usrId))
                throw new Exception("not authenticated");

            return $"{usrId}_{txId}";
        }

        /// <summary>
        /// map of txId 
        /// </summary>
        static readonly ConcurrentDictionary<string, Web3Tx> _pendingTx = new ConcurrentDictionary<string, Web3Tx>();

        [Authorize]
        [HttpGet("result/{escapedTxId}")]
        public async Task<string[]> Finalize(string escapedTxId)
        {
            var sessionId = sessionToken(Uri.UnescapeDataString(escapedTxId));

            Web3Tx session;
            if(!_pendingTx.TryGetValue(sessionId, out session))
            {
                throw new Exception("session not found");
            }

            await session.session.Connect();

            return session.session.Accounts;

        }

        
        [Authorize]
        [HttpGet("setup")]
        public TxStatusModel Initialize()
        {
            var clientMeta = new ClientMeta()
            {
                Name = "WalletConnectSharp",
                Description = "An example that showcases how to use the WalletConnectSharp library",
                Icons = new[] { "https://app.warriders.com/favicon.ico" },
                URL = "https://app.warriders.com/"
            };

            //WalletConnect(ClientMeta clientMeta, string bridgeUrl = null, ITransport transport = null, ICipher cipher = null, int chainId = 1, EventDelegator eventDelegator = null) : base(clientMeta, bridgeUrl, transport, cipher, chainId, eventDelegator)
        

        var client = new WalletConnect(clientMeta, chainId:3);

            Console.WriteLine("Connect using the following URL");
            Console.WriteLine(client.URI);

            var txId = Guid.NewGuid().ToString();

            var sessionId = sessionToken(txId);

            _pendingTx[sessionId] = new Web3Tx
            {
                //session = client,
                status = TxEnumModel.waitingToConnect
            };

            Task.Factory.StartNew(async () =>
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(1));

                    _logger.LogDebug("check web3 connected");

                    await client.Connect();


                    _logger.LogDebug(" web3 is connected");///

                    //var connected = await client.ConnectSession();
                    /*
                    try
                    {
                        var done = await client.EthSendTransaction(new WalletConnectSharp.Core.Models.Ethereum.TransactionData
                        {
                            from = @"0x6855fc009715c020E785cd16Ba26508f7A5c5130",//@"0x65071eb69ee7B08C0f54A071F9385802AB7CBeD6",
                            to = @"0x71A3cAd0C4D5fe26D8a463Ac7090d39337AFB3b2",
                            chainId = 3,
                            value = @"0x429D069189E0000"  //"300000000000000000"
                        });
                    }catch(Exception ex)
                    {
                        _logger.LogError($"failed to connect :{ex}");
                        throw ex;

                    }
                    */

                    _logger.LogDebug("web3 trs done");


                    var walltes = client.Accounts;

                    await client.Disconnect();

                    client.Dispose();

                    _pendingTx[sessionId].status = TxEnumModel.connected;

                }
                catch (Exception ex)
                {
                    _logger.LogError($"failed to connect :{ex}");
                    throw ex;
                }

            });



            return new TxStatusModel
            {
                connectURL = client.URI,
                status = TxEnumModel.waitingToConnect,
                txId = txId
            };

        }
    }
}
