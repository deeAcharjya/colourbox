using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Utilities;

namespace cb_cli
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((builderContext, config) => {
                    config
                    .AddJsonFile("appsettings.noSVN.json", optional: true, reloadOnChange: false);
                })
                .ConfigureServices((hostContext, services) =>
                {
                    services.ConfigureUtilities(hostContext.Configuration);

                    services.AddHostedService<Worker>();
                });
    }
}
