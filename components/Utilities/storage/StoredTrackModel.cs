using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities
{
    public class StoredTrackModel : StoredMediaModel
    {

        public TrackDetailsModel details { get; set; }

        public string bandId { get; set; }

        public TrackCalculatedModel calculatedDetails { get; set; }

        public NFTDetailsModel nft { get; set; }

        /// <summary>
        /// we set this with the reason if we cannot support the track
        /// </summary>
        public string notSupportedError { get; set; }

        public override string publicFile(string[] props = null)
        {
            return calculatedDetails?.mp3File;
        }


    }
}
