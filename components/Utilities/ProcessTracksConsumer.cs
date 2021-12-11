using MassTransit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Utilities;
using System.IO;
using System.Text.RegularExpressions;

namespace Utilities
{
    public class TrackSumbitted
    {
        public string trackId { get; set; }
    }

    public class ProcessTracksConsumer : IConsumer<TrackSumbitted>
    {
        protected readonly IDbService _dbService;
        protected readonly IStorageProvider _storage;
        protected readonly ILogger _logger;

        public ProcessTracksConsumer(Utilities.IDbService db,
            IStorageProvider storage,
            ILogger<ProcessTracksConsumer> logger)
        {
            _logger = logger;
            _dbService = db;
            _storage = storage;
        }


        public async Task Consume(ConsumeContext<TrackSumbitted> context)
        {
            try
            {
                var collection = _dbService.getCollection<StoredTrackModel>().OfType<StoredTrackModel>();

                var track = await collection.Find(t => t.id == context.Message.trackId).SingleAsync();

                if(null != track.calculatedDetails)
                {
                    _logger.LogInformation($"track {track.id} already is processed");
                    return;
                }

                _logger.LogDebug($"processing track {track.id}");

                var inputFileName = await _storage.ensureLocalFileAsync(track.originalFile);
                var fileNameNoExt = Path.GetFileNameWithoutExtension(inputFileName);

                var folder = Path.GetDirectoryName(inputFileName);


                var trackInfo = ExecExternal.Run(_logger, "sox",
                        $"--i {inputFileName}");

                /* We need regex extraction as there are no gaps between values
                 Input File     : '/tmpStorage/file_619c63472568ed1fe330ff0c/wav/2021-11-24-03-60ec91ba-2a1a-482f-8a15-da294ccc22fc/original.wav'
                Channels       : 2Sample Rate    : 8000Precision      : 16-bitDuration       : 00:00:33.53 = 268237 
                 samples ~ 2514.72 CDDA sectorsFile Size      : 1.07MBit Rate       : 256kSample Encoding: 16-bit Signed Integer PCM
                 */

                TrackCalculatedModel calculated = null;

                try
                {
                    _logger.LogDebug($"trackInfo = {trackInfo}");

                    var pattern = @".*Channels\s*:\s*(?<channels>\d+).*Sample\sRate\s*:\s*(?<rate>\d+).*Precision\s*:\s*(?<precision>\d+)-bit.*Duration.*=\s*(?<samples>\d+)\ssamples.*Bit\sRate\s*:\s*(?<bitrate>\d+).*Encoding.*:\s*(?<encoding>\d+)-bit.*";

                    var regex = new Regex(pattern);
                    var match = regex.Match(trackInfo);
                    if (!match.Success)
                    {
                        throw new NotSupportedException($"failed to parse track File info {trackInfo}");
                    }

                    var parsed = regex.GetGroupNames().Where(n=>"0"!=n)
                        .ToDictionary(k => k, v => int.Parse(match.Groups[v].Value));

                    /*
                    if (16 != parsed["encoding"])
                        throw new NotSupportedException("Sample encoding must be 16-bit Signed Integer PCM");

                    if (16 != parsed["precision"])
                        throw new NotSupportedException("Precision must be 16-bit");
                    

                    if (8000 != parsed["rate"])
                        throw new NotSupportedException("Sample rate must be 8000");
                    */

                    if (2 != parsed["channels"])
                        throw new NotSupportedException("Must have 2 channels");

                    calculated = new TrackCalculatedModel
                    {
                        sampleRate = parsed["rate"],
                        samples = parsed["samples"]
                    };
                }
                catch (Exception ex)
                {
                    var doneFailed = collection.UpdateOne(t => t.id == context.Message.trackId,
                        Builders<StoredTrackModel>.Update.Set(t => t.notSupportedError, ex.Message));

                    if (!doneFailed.IsAcknowledged)
                        throw new Exception("mongo failed to ack");

                    throw ex;
                }

                var mp3File = Path.Combine(folder, fileNameNoExt + ".mp3");

                if (File.Exists(mp3File))
                {
                    File.Delete(mp3File);
                }

                var outputStr = ExecExternal.Run(_logger, "ffmpeg",
                    $"-i {inputFileName} -acodec libmp3lame {mp3File}");

                if (!File.Exists(mp3File))
                {
                    throw new Exception($"mp3file {mp3File} is not there");
                }


                var waveformLight = Path.Combine(folder, fileNameNoExt + "_waveformLight.png");

                if (File.Exists(waveformLight))
                {
                    File.Delete(waveformLight);
                }

                calculated.waveFormWidth = calculated.durationInSeconds() * 50;

                outputStr = ExecExternal.Run(_logger, "audiowaveform",
                    $"-i {inputFileName} -o {waveformLight} --pixels-per-second 50  -w {calculated.waveFormWidth} -h 200 --background-color 000000 --waveform-color ffffffcc");

                if (!File.Exists(waveformLight))
                {
                    throw new Exception($"waveformLight {waveformLight} is not there");
                }

                calculated.mp3File = $"{track.storageFolder}/mp3File.mp3";

                using (var fs = new FileStream(mp3File,FileMode.Open))
                {
                    await _storage.SaveStreamAsync(calculated.mp3File, fs);
                }

                calculated.waveformLight = $"{track.storageFolder}/waveformLight.png";

                using (var fs = new FileStream(waveformLight, FileMode.Open))
                {
                    await _storage.SaveStreamAsync(calculated.waveformLight, fs);
                }

                var done = await collection.UpdateOneAsync(t => t.id == context.Message.trackId,
                    Builders<StoredTrackModel>.Update.Set(t => t.calculatedDetails, calculated));

                if (!done.IsAcknowledged)
                    throw new Exception("mongo failed to ack");

            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
    }
}
