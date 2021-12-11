using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.login
{
    /// <summary>
    /// wallets the user might have
    /// </summary>
    public class UserWalletModel
    {
        public string address { get; set; }

        /// <summary>
        /// is this wallet managed by us
        /// </summary>
        public bool isCustodial { get; set; }


    }
}
