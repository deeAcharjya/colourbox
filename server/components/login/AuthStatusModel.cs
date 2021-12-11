using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.login
{
    /// <summary>
    /// used to send server status to front end
    /// </summary>
    public class AuthStatusModel
    {
        public string nounce { get; set; }

        public string signature { get; set; }
        
        /// <summary>
        /// essentially the encrypted nounce
        /// </summary>
        public string nounceId { get; set; }

        [JsonConstructor]
        private AuthStatusModel() { }

        public AuthStatusModel(string privateKey, string message = null)
        {
            if(null == message)
            {
                message = "Verifying wallet ownership";
            }

            nounce  = $"{message} - {Guid.NewGuid()}";
            nounceId = Utilities.GeneratedWallet.encrypt(nounce, privateKey);
        }

        public string recoverNonce(string privateKey)
        {
            if (string.IsNullOrWhiteSpace(nounceId))
                throw new Exception("nounceId is empty");

            return Utilities.GeneratedWallet.decrypt(privateKey, nounceId);
        }
    }
}
