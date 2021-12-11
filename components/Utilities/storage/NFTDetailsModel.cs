using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities
{
    [BsonIgnoreExtraElements]
    public class NFTDetailsModel
    {
        public string contractAddress { get; set; }
        public string clonetxId { get; set; }
        
        [ExportAsOptional]
        public DateTime created { get; set; }

        /// <summary>
        /// The saga used to create this
        /// </summary>
        [ExportAsOptional] 
        public Guid sagaId { get; set; }

        
        public string chainId { get; set; }

        /// <summary>
        /// If this NFT was created using custodial wallet this will have that wallet address
        /// </summary>
        [ExportAsOptional]
        public string custodialAccount { get; set; }
    }
}
