using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities
{
    /// <summary>
    /// calculated details of a track
    /// </summary>

    [BsonIgnoreExtraElements]
    public class TrackCalculatedModel
    {
        /// <summary>
        /// the waveform Image in Light mode
        /// </summary>
        public string waveformLight { get; set; }


        public int sampleRate { get; set; }

        /// <summary>
        /// Total Number of samples
        /// </summary>
        public int samples { get; set; }

        /*
         * duration of track in seconds = samples/sampleRate
         */

        public string mp3File { get; set; }

        /// <summary>
        /// The waveForm width in pixels it is used to display the track
        /// </summary>
        public int waveFormWidth { get; set; }

        public int durationInSeconds()
        {
            return (int)Math.Ceiling((samples * 1.0) / sampleRate);
        }

    }
}
