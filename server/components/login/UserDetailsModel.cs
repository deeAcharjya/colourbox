using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.login
{
    public class UserDetailsModel
    {
        [Utilities.ExportAsOptional]
        public string phoneNumber { get; set; }

        [Utilities.ExportAsOptional]
        public string primaryEmail { get; set; }

        /// <summary>
        /// a user can have many wallets
        /// </summary>
        [Utilities.ExportAsOptional]
        public string[] web3Wallets { get; set; }

    }
}
