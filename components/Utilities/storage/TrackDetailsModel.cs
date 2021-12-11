using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities
{
    /// <summary>
    /// calculated details of a track
    /// </summary>
    public class TrackDetailsModel
    {
        /// <summary>
        /// The imageId for the track album image
        /// </summary>
        [ExportAsOptional]
        public string imageId { get; set; }


        [ExportAsOptional]
        public string albumId { get; set; }


        public string displayName { get; set; }

        /// <summary>
        /// any details about this 
        /// </summary>
        [ExportAsOptional]
        public string description { get; set; }


        public string[] tags { get; set; }

    }
}
