using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities.Bids
{
    public class SalesOrderDetailsModel
    {
        public string trackId { get; set; }
        public string tokenId { get; set; }

        public string sellerAddress { get; set; }

        /// <summary>
        /// The tx that created this bid
        /// </summary>
        public string txId { get; set; }

        public string chainId { get; set; }

        public string amount { get; set; }
    }
}
