using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.web3
{
    public class TxStatusModel
    {
        public string txId { get; set; }
        public string connectURL { get; set; }

        public TxEnumModel status { get; set; }
    }
}
