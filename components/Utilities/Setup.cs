using GreenPipes;
using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.ExtensionsDependencyInjectionIntegration;
using MassTransit.RabbitMqTransport;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities
{
    public class MQConfig
    {
        public string host { get; set; } = "rabbitmq";
        public ushort port { get; set; } = 5672;

        public string username { get; set; } = "revRabbit";
        public string password { get; set; }

        public string virtualHost { get; set; } = "/";
             
    }


    public static class UtilsConfigureExtensions
    {
        public static void ConsumerPolicy<T>(IConsumerConfigurator<T> c) where T :class
        {
            c.UseMessageRetry(r =>
            {
                r.Exponential(3, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(1));

                r.Ignore<ArgumentNullException>();
                r.Ignore<NotSupportedException>();
                r.Ignore<InvalidOperationException>();
            });
        }


        //used to seperate out the consumers to diferent process
        public static void AddTrackConsumers(IConfiguration config, IServiceCollectionBusConfigurator x)
        {
            var mongoConfig = config.GetSection("mongo").Get<MongoConfig>();

            x.AddSagaStateMachine<nftdeploy.TrackNftStateMachine, nftdeploy.TrackNftState>()
                .MongoDbRepository(r =>
                {
                    r.Connection = mongoConfig.connectionString;
                    r.DatabaseName = mongoConfig.dbname;
                });


            x.AddConsumer<ProcessTracksConsumer>(c=> ConsumerPolicy(c));
            x.AddConsumer<nftdeploy.CreateNFTConsumer>(c => ConsumerPolicy(c));
        }

        public static void ConfigureUtilities(this IServiceCollection services, 
            IConfiguration config, Action<IConfiguration,IServiceCollectionBusConfigurator> consumers = null)
        {
            services.AddTransient<IDbService, DbService>();
            services.AddTransient<IStorageProvider, S3StorageProvider>();
            services.AddTransient<ICacheProvider, CacheProvider>();

            services.AddTransient<WalletService>();

            var mqConfig = config.GetSection("rabbitmq").Get<MQConfig>();

            services.AddMassTransit(x =>
            {

                x.AddDelayedMessageScheduler();

                if (null != consumers)
                {
                    consumers(config,x);
                }

                //x.AddConsumer<MessageConsumer>();


                x.UsingRabbitMq((context, cfg) =>
                {
                    if(null != consumers)
                    {
                        cfg.ConfigureEndpoints(context);
                    }

                    cfg.Host(mqConfig.host, mqConfig.port, mqConfig.virtualHost, h =>
                    {
                        h.Username(mqConfig.username);
                        h.Password(mqConfig.password);
                    });
                    
                });
            });
            services.AddMassTransitHostedService(true);
            
        }
    }
}
