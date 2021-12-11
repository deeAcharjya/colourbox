using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Nethereum.Signer;

namespace server.components.login
{
    


    [ApiController]
    [Route("api/[controller]")]

    public class AuthController: ControllerBase
    {
        readonly Utilities.IDbService _dbService;
        readonly ILogger _logger;
        readonly AuthConfig _myConfig;

        public AuthController(Utilities.IDbService db,
            IConfiguration config,
            ILogger<AuthController> logger)
        {
            _logger = logger;
            _dbService = db;
            _myConfig = AuthConfig.createFromConfig(config);
        }

        [HttpGet("status")]
        public AuthStatusModel getAuthStatus()
        {
            //https://ethereum.stackexchange.com/questions/74759/verifying-if-a-user-actually-owns-the-address

            /*
            */
            return  new AuthStatusModel(_myConfig.privateKey);

        }

        

        [HttpPost]
        public async Task<LoginResponceModel> Login([FromBody] AuthCredsModel creds)
        {
            
            var userCollection = _dbService.getCollection<UserModel>();

            var wallet = creds?.details?.web3Wallets.SingleOrDefault();
            if (string.IsNullOrEmpty(wallet))
            {
                throw new Utilities.ExceptionWithCode("must sign in with just one wallet");
            }

            var signer = new EthereumMessageSigner();
            var resultantAddr = signer.EncodeUTF8AndEcRecover(
                creds.web3Auth.recoverNonce(_myConfig.privateKey), 
                creds.web3Auth.signature);

            if (wallet != resultantAddr)
                throw new Utilities.ExceptionWithCode("authentication failed");

            var user = await userCollection.Find(u => u.details.web3Wallets.Contains(wallet)).SingleOrDefaultAsync();

            //var user = await userCollection.Find(u => u.details.phoneNumber == creds.details.phoneNumber || u.details.primaryEmail == creds.details.primaryEmail).SingleOrDefaultAsync();

            //todo: check OTP
            if (null == user)
            {
                user = new UserModel
                {
                    details = creds.details
                };

                await userCollection.InsertOneAsync(user);
            }

            return new LoginResponceModel
            {
                jwt = GenerateJWTToken(user),
                userId = user.id,
                displayName = user.details?.primaryEmail??user.details?.phoneNumber??"",
                walletAddress = user.details?.web3Wallets.FirstOrDefault()
            };

        }

        string GenerateJWTToken(UserModel user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_myConfig.privateKey));

            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.id),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                //new Claim(JwtRegisteredClaimNames.UniqueName, user.details?.primaryEmail??user.details?.phoneNumber),
            };

            var token = new JwtSecurityToken(
            issuer: _myConfig.jwtIssuer,
            audience: _myConfig.jwtIssuer,
            claims: claims,
            expires: DateTime.Now.AddMinutes(_myConfig.jwtExpiryMin),
            signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


    }
}
