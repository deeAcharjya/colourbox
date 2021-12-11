using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Numerics;
using Nethereum.Hex.HexTypes;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Utilities.NonSignedBids.ContractDefinition
{
    public partial class SliceRange : SliceRangeBase { }

    public class SliceRangeBase 
    {
        [Parameter("uint256", "begin", 1)]
        public virtual BigInteger Begin { get; set; }
        [Parameter("uint256", "end", 2)]
        public virtual BigInteger End { get; set; }
        [Parameter("uint8", "exists", 3)]
        public virtual byte Exists { get; set; }
    }
}
