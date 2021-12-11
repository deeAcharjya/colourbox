using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.media
{
    public class MediaModel
    {
        public string id { get; set; }
        public int width{ get; set; } //in seconds

        public string waveform { get; set; }
    }
}
