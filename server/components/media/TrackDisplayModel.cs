using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.media
{
    /// <summary>
    /// Used to send display Information to the front end
    /// The paths here are public paths
    /// </summary>
    public class TrackDisplayModel
    {
        public Utilities.StoredTrackModel track { get; set; }

        public string audioPath { get; set; }

        public string lightWaveForm { get; set; }

        /// <summary>
        /// Track display duration
        /// </summary>
        public string duration { get; set; }

        /// <summary>
        /// Track duration in seconds
        /// </summary>
        public int durationinSec { get; set; }

        /// <summary>
        /// used for contructor
        /// </summary>
        [JsonConstructor]
        public TrackDisplayModel() { }


        public TrackDisplayModel(Utilities.StoredTrackModel track, Utilities.IStorageProvider storage)
        {
            this.track = track;

            if(null != track.calculatedDetails)
            {
                this.audioPath = storage.publicPath(track.calculatedDetails?.mp3File);
                this.lightWaveForm = storage.publicPath(track.calculatedDetails?.waveformLight);

                this.durationinSec = track.calculatedDetails.durationInSeconds();
                this.duration = TimeSpan.FromSeconds(this.durationinSec).ToString();
                
            }
        }
    }
}
