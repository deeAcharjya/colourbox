using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
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
using Utilities;

namespace server.components.media
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadsController : ControllerBase
    {

		readonly IDbService _dbService;
		readonly IStorageProvider _storage;
		readonly ILogger _logger;

		public UploadsController(Utilities.IDbService db,
			IStorageProvider storage,
			ILogger<UploadsController> logger)
		{
			_logger = logger;
			_dbService = db;
			_storage = storage;
		}

		readonly static string[] _ALLOWEDDIRECTUPLODVERBS = new string[] { "POST", "PUT", "GET" };


		/// <summary>
		/// creates a authorization signature to upload for AWS
		/// https://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html
		/// </summary>
		/// <param name="datetime"></param>
		/// <param name="to_sign"></param>
		/// <returns></returns>
		[HttpGet("signature")]
		[Authorize]
        public string uploadSignature([FromQuery] string datetime, [FromQuery] string to_sign, [FromQuery] string canonical_request)
		{
			
			/* canonical_request
			 POST
/myelasticnetworkdata-dev/dee_dev_revcore2/rev_5be29cc43f45b1492cc4c4b9/page/beaba9d3-4d37-4347-bb0b-ed54382e2ae8/original.TIF
uploads=
host:s3-us-west-2.amazonaws.com
x-amz-date:20181107T080607Z

host;x-amz-date
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
			*/

			var CRLines = canonical_request.Split('\n');
			if (CRLines.Length < 2)
			{
				_logger.LogWarning($"uploadSignature invalid canonical_request : {canonical_request}");
				throw new ExceptionWithCode($"canonical_request doesn't have enough lines", System.Net.HttpStatusCode.Forbidden);
			}

			if (!_ALLOWEDDIRECTUPLODVERBS.Contains(CRLines[0]))
			{
				_logger.LogWarning($"uploadSignature canonical_request verb not allowed. canonical_request: {canonical_request}");
				throw new ExceptionWithCode("invalid request", System.Net.HttpStatusCode.Forbidden);
			}

			var userId = this.GetUserId();
			var dummyageId = _storage.keyForDirectUpload($"{userId}/");


			var reqStartswith = $"/{_storage.config.bucketName}/{dummyageId}";

			

			if (!CRLines[1].StartsWith(reqStartswith))
			{
				_logger.LogWarning($"uploadSignature canonical_request mismatch. reqStartswith :{reqStartswith} - canonical_request: {canonical_request}");
				throw new ExceptionWithCode("invalid request", System.Net.HttpStatusCode.Forbidden);
			}


			var credsStrings = new[]
			{
				datetime.Substring(0, 8),
				_storage.config.bucketRegion,
				"s3",
				"aws4_request"
			};

			using (var algorithm = SHA256.Create())
			{
				// Create the at_hash using the access token returned by CreateAccessTokenAsync.
				var hash = algorithm.ComputeHash(Encoding.UTF8.GetBytes(canonical_request));
				var signParts = new[]
				{
					"AWS4-HMAC-SHA256",
					Uri.EscapeDataString(datetime),
					string.Join('/', credsStrings),
					ToHexString(hash)
				};


				var calculatedToSign = /*Uri.EscapeDataString*/
			(string.Join('\n', signParts));


				if (to_sign != calculatedToSign)
				{
					throw new ExceptionWithCode("failed to sign");
				}
			}

			var signing_key = getSignatureKey(
				key: _storage.config.secretKey,
				dateStamp: datetime.Substring(0, 8),
				regionName: _storage.config.bucketRegion,
				serviceName: "s3"
				);

			var signature = HmacSHA256(to_sign, signing_key);

			// to lowercase hexits
			return ToHexString(signature);
		}

		static string ToHexString(byte[] data, bool lowercase = true)
		{
			var sb = new StringBuilder();
			for (var i = 0; i < data.Length; i++)
			{
				sb.Append(data[i].ToString(lowercase ? "x2" : "X2"));
			}
			return sb.ToString();
		}

		//https://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html#signature-v4-examples-dotnet
		static byte[] HmacSHA256(String data, byte[] key)
		{
			var hashAlgorithm = new HMACSHA256(key);

			return hashAlgorithm.ComputeHash(Encoding.UTF8.GetBytes(data));
		}

		static byte[] getSignatureKey(String key, String dateStamp, String regionName, String serviceName)
		{
			byte[] kSecret = Encoding.UTF8.GetBytes(("AWS4" + key).ToCharArray());
			byte[] kDate = HmacSHA256(dateStamp, kSecret);
			byte[] kRegion = HmacSHA256(regionName, kDate);
			byte[] kService = HmacSHA256(serviceName, kRegion);
			byte[] kSigning = HmacSHA256("aws4_request", kService);

			return kSigning;
		}



	}
}
