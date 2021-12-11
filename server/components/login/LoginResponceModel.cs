using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.login
{
    public class LoginResponceModel
    {
        public string jwt { get; set; }
        public string userId { get; set; }

        public string displayName { get; set; }

        public string walletAddress { get; set; }
    }
}
