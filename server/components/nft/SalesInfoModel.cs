using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Utilities.nftdeploy;

namespace server.components.nft
{
    /// <summary>
    /// Used to return any info that applies to seling NFts from our site
    /// </summary>
    [Utilities.ForceTypeImport("ChainInfoModel")]
    public class SalesInfoModel
    {
        /// <summary>
        /// The wallet address used by our server
        /// </summary>
        public string marketWallet { get; set; }

        public string bidMakerAddress { get; set; }

        public string nftBaseUrl { get; set; }

        public string cbFactoryAddress { get; set; }

        public string salesBookAddress { get; set; }

        public Dictionary<string, ChainInfoModel> chainInfo { get; set; }
    }
}
