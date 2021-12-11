using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Utilities;

namespace server.components.media
{
    public class MediaDisplayModel
    {
        public string publicPath { get; set; }

        public StoredMediaModel data { get; set; }
    }
}
