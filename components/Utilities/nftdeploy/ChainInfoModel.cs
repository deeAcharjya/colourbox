using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities.nftdeploy
{
    public class ChainInfoModel
    {
        public string hexChainId { get; set; }

        public string rpcProvider { get; set; }

        /// <summary>
        /// The currency symobol in this chain
        /// </summary>
        public string sym { get; set; }

        /// <summary>
        /// exchage rate
        /// </summary>
        public float rate { get; set; }

        /// <summary>
        /// name of this chain
        /// </summary>
        public string name { get; set; }

        /// <summary>
        /// The rl prefix for addressScan ex
        /// https://ropsten.etherscan.io/address
        /// </summary>
        public string addressScan { get; set; }


        public string txScan { get; set; }
    }
}
