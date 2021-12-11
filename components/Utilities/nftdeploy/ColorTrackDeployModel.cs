using MassTransit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Utilities.nftdeploy
{
    public class ColorTrackDeployModel : CorrelatedBy<Guid>
    {
        public string trackId { get; set; }

        public int salePercent { get; set; }

        public string chainId { get; set; }

        [ExportAsOptional]
        public Guid CorrelationId { get; set; }

        [ExportAsOptional]
        public string Minter { get; set; }


        public string priceofSlice { get; set; }

    }


}
