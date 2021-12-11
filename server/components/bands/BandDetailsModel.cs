using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.bands
{
    public class BandDetailsModel
    {
        public string displayName { get; set; }


        [Utilities.ExportAsOptional]
        public string firstName { get; set; }

        [Utilities.ExportAsOptional]
        public string lastName { get; set; }

        [Utilities.ExportAsOptional]
        public string city{ get; set; }

        [Utilities.ExportAsOptional]
        public string country { get; set; }

        /// <summary>
        /// The Unique url for the band
        /// </summary>
        [Utilities.ExportAsOptional]
        public string slug { get; set; }

        [Utilities.ExportAsOptional]
        public string bio { get; set; }

        [Utilities.ExportAsOptional]
        public string imageId { get; set; }
    }
}
