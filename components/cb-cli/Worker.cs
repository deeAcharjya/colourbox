using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Utilities;

namespace cb_cli
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        readonly IConfiguration _config;
        readonly IHostApplicationLifetime _life;
        readonly WalletService _wallet;



        public Worker(
            IConfiguration config,
            IHostApplicationLifetime life,
            WalletService wallet,
            ILogger<Worker> logger
            )
        {
            _logger = logger;
            _config = config;
            _life = life;
            _wallet = wallet;
        }


        enum commands { generateMemonic, createwallets, verifywallets }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                var command = _config.GetValue<commands>("command");

                _logger.LogInformation($"running command {command}");

                switch (command)
                {
                    case commands.generateMemonic:
                        _wallet.generateMemonic();
                        break;
                    case commands.createwallets:
                        await _wallet.createWallets();
                        break;
                    case commands.verifywallets:
                        await _wallet.verifyWallets();
                        break;
                    default:
                        throw new Exception("command not handled");
                }
                
            }
            catch(Exception ex)
            {
                _logger.LogError($"failed to run: {ex}");
            }

            _life.StopApplication();
        }
    }
}
