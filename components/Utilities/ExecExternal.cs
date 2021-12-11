using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;

namespace Utilities
{
    /// <summary>
    /// utilities to Run an external Process
    /// </summary>
    public static class ExecExternal
    {
        public static string Run(ILogger _logger, string exeName, string arguments,
            Action<string> OnOutput = null,
            Action<string> OnError = null
            )
        {
            var process = new Process();

            process.StartInfo.UseShellExecute = false;
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.RedirectStandardError = true;

            {

                /*
                var metaInstance = new OriginalImageMetaData();

                var propMap = new Dictionary<string, string>
                {
                    { nameof(metaInstance.numberOfPages),"%p"},
                    { nameof(metaInstance.width),"%w"},
                    { nameof(metaInstance.height),"%h"},
                    { nameof(metaInstance.resolution_x),"%x"},
                    { nameof(metaInstance.resolution_y),"%y"},
                    { nameof(metaInstance.format),"\"%m\""},

                };
                */


            }

            process.StartInfo.Arguments = arguments;
            process.StartInfo.FileName = exeName;

            string outputStr = "";
            process.OutputDataReceived += (sender, args) =>
            {
                _logger.LogDebug($"StdOutput : {args.Data}");

                if (null != OnOutput)
                    OnOutput(args.Data);

                outputStr += args.Data;
            };

            process.ErrorDataReceived += (sender, args) => {
                if (null != OnError)
                    OnError(args.Data);

                _logger.LogError($"StdError : {args.Data}");
            };

            _logger.LogDebug($"executing {exeName} {arguments}");
            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();


            process.WaitForExit();
            process.CancelOutputRead();

            if (0 != process.ExitCode)
            {
                throw new Exception($"program {exeName} exited with code {process.ExitCode}");
            }

            _logger.LogDebug($"completed executing {exeName} ");

            return outputStr;

        }

    }
}
