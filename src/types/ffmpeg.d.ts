declare module 'ffmpeg-static' {
    const ffmpegPath: string;
    export default ffmpegPath;
  }
  
  declare module 'fluent-ffmpeg' {
    interface FfmpegCommand {
      screenshots(options: {
        timestamps: number[];
        filename: string;
        folder: string;
        size?: string;
      }): FfmpegCommand;
      on(event: 'end', callback: () => void): FfmpegCommand;
      on(event: 'error', callback: (err: Error) => void): FfmpegCommand;
    }
  
    interface FfprobeStream {
      codec_type: string;
      codec_name?: string;
      width?: number;
      height?: number;
    }
  
    interface FfprobeFormat {
      duration?: number;
      bit_rate?: string;
    }
  
    interface FfprobeData {
      streams: FfprobeStream[];
      format: FfprobeFormat;
    }
  
    function ffprobe(path: string, callback: (err: Error | null, data: FfprobeData) => void): void;
  
    function setFfmpegPath(path: string): void;
  
    function setFfprobePath(path: string): void;
  
    function ffmpeg(input?: string): FfmpegCommand;
  
    export default ffmpeg;
    export { ffprobe, setFfmpegPath, setFfprobePath };
  }