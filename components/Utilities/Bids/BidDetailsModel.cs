using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities.Bids
{
    public class BidDetailsModel
    {
        public string baseUrl { get; set; }

        public string bidderAddress { get; set; }

        /// <summary>
        /// The tx that created this bid
        /// </summary>
        public string txId { get; set; }

        public string chainId { get; set; }

    }
}
