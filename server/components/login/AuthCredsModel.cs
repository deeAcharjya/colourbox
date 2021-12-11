using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace server.components.login
{
    public class AuthCredsModel
    {
        public UserDetailsModel details { get; set; }

        public AuthStatusModel web3Auth{ get; set; }

    }
}
