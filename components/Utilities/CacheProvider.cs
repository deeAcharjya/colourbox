using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace Utilities
{

    public interface ICacheProvider
    {
        System.IO.Stream createCacheStream(String ext = null);
        TemporaryFileHolder createTmpFile(String ext = null);

    }

    public class CacheProvider: ICacheProvider
    {
        readonly String _cacheFolder;
        public CacheProvider(IConfiguration configuration)
        {
            _cacheFolder = configuration["cacheFolder"];

            if (string.IsNullOrWhiteSpace(_cacheFolder))
            {
                _cacheFolder = "/ne-cache";
            }

            if (!Directory.Exists(_cacheFolder))
                Directory.CreateDirectory(_cacheFolder);
        }


        public TemporaryFileHolder createTmpFile(String ext = null)
        {
            return new TemporaryFileHolder(_cacheFolder, ext);
        }

        public Stream createCacheStream(String ext = null)
        {
            return new CacheStream(_cacheFolder, ext ?? "temp");
        }
    }

    /// <summary>
    /// Creates a temporary file name that will be deleted when theHolder object is disposed
    /// </summary>
    public class TemporaryFileHolder : IDisposable
    {
        public string fileName { get; }

        public TemporaryFileHolder(String cacheFolder, String ext)
        {
            fileName = Path.Combine(cacheFolder, $"{Guid.NewGuid().ToString()}.{ext}");
        }


        #region IDisposable Support
        private bool disposedValue = false; // To detect redundant calls

        protected virtual void Dispose(bool disposing)
        {
            if (!disposedValue)
            {
                if (disposing)
                {
                    //dispose managed state (managed objects).
                }

                //dispose unmanaged resources here
                if (File.Exists(fileName))
                {
                    Task.Delay(1000).ContinueWith((a) =>
                    {
                        try
                        {
                            File.Delete(fileName);
                        }
                        catch (Exception ex)
                        {
                            var t = ex.Message;
                        }
                    });
                }

                disposedValue = true;
            }
        }


        ~TemporaryFileHolder()
        {
            //   // Do not change this code. Put cleanup code in Dispose(bool disposing) above.
            Dispose(false);
        }

        // This code added to correctly implement the disposable pattern.
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
        #endregion

    }

    /// <summary>
    /// Create a stream where the unbderlying file will be deleted when the Stream will be deleted
    /// </summary>
    public class CacheStream : FileStream
    {
        public CacheStream(String cacheFolder, String ext) :
            base(Path.Combine(cacheFolder, $"{Guid.NewGuid().ToString()}.{ext}"),
                FileMode.Create, FileAccess.ReadWrite, FileShare.ReadWrite)
        { }

        protected override void Dispose(bool disposing)
        {
            var fileName = this.Name;
            base.Dispose(disposing);
            Task.Delay(1000).ContinueWith((a) =>
            {
                try
                {
                    File.Delete(fileName);
                }
                catch (Exception ex)
                {
                    var t = ex.Message;
                }
            });
        }
    }
}
