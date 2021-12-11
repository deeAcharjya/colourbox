using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WalletConnectSharp.Core;

namespace server.components.web3
{
    public class Web3Tx
    {
        public WalletConnectSession session { get; set; }

        public TxEnumModel status { get; set; }
    }
}
