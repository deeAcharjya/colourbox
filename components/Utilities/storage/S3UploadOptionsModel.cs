using System;
using System.Collections.Generic;
using System.Text;

namespace Utilities
{
    public class S3UploadOptionsModel
    {
		

		// this class is mostly pased to evaporate create()
		//https://github.com/TTLabs/EvaporateJS/wiki/Evaporate.create()

		/// <summary>
		/// AWS Bucket
		/// </summary>
		public string bucket { get; set; }


		/// <summary>
		///  AWS key, for example 'AKIAIQC7JOOdsfsdf'
		/// </summary>
		public string aws_key { get; set; }


		public string awsRegion { get; set; }

		public string aws_url { get; set; }

		/*
		 * aws_url: default='https://s3.amazonaws.com', the S3 endpoint URL. If you have a bucket in a region other than US Standard, you will need to change this to the correct endpoint from the AWS Region list.
		 */

		
	}
}
