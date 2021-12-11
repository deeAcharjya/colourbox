using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.web3
{
    [JsonConverter(typeof(StringEnumConverter))]
    public enum TxEnumModel
    {
        waitingToConnect,
        connected
    }
}
