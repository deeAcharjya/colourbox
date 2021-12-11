using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace server.components.login
{
    public class AuthConfig
    {
        public string privateKey { get; set; }
        public string jwtIssuer { get; set; } = @"colourbox";

        public int jwtExpiryMin { get; set; } = 60 * 24 * 7; //7 days

        public static AuthConfig createFromConfig(IConfiguration Configuration)
        {
            var config = Configuration.GetSection("login").Get<AuthConfig>();
            if (null == config)
                config = new AuthConfig();

            if (string.IsNullOrEmpty(config.privateKey))
            {
                var rnd = new Random();
                config.privateKey = Enumerable.Range(0, 64).Select(i => (char)rnd.Next('a', 'z')).ToString();
            }

            return config;

        }

    }
}
