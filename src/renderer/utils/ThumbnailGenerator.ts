import { FFmpeg } from '@ffmpeg/ffmpeg';
import { VideoFile, ThumbnailSettings, VideoMetadata } from '../../types/store.js';
import path from 'path';

export class ThumbnailGenerator {
  private ffmpeg: FFmpeg;
  private thumbnailDir: string;
  private isLoaded: boolean = false;

  constructor(thumbnailDir: string) {
    this.thumbnailDir = thumbnailDir;
    this.ffmpeg = new FFmpeg();
  }

  async init(): Promise<void> {
    if (!this.isLoaded) {
      await this.ffmpeg.load();
      this.isLoaded = true;
    }
  }

  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    await this.init();

    const videoData = await window.electronAPI.readFile(videoPath);
    await this.ffmpeg.writeFile('input.mp4', videoData);

    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      'output.json'
    ]);

    const outputData = await this.ffmpeg.readFile('output.json') as Uint8Array;
    const info = JSON.parse(new TextDecoder().decode(outputData));
    const videoStream = info.streams.find((s: any) => s.codec_type === 'video');

    return {
      duration: parseFloat(info.format.duration) || 0,
      width: videoStream?.width || 0,
      height: videoStream?.height || 0,
      codec: videoStream?.codec_name || '',
      bitrate: parseInt(info.format.bit_rate || '0', 10),
    };
  }

  async generateThumbnails(
    video: VideoFile,
    settings: ThumbnailSettings,
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    await this.init();

    const metadata = await this.getVideoMetadata(video.path);
    const duration = metadata.duration;
    const count = Math.min(settings.maxCount, Math.max(1, Math.floor(duration / 60)));
    const interval = duration / (count + 1);
    const thumbnailPaths: string[] = [];

    const videoData = await window.electronAPI.readFile(video.path);
    await this.ffmpeg.writeFile('input.mp4', videoData);

    for (let i = 1; i <= count; i++) {
      const timestamp = interval * i;
      const outputFilename = `${video.id}_${i}.jpg`;
      const outputPath = path.join(this.thumbnailDir, outputFilename);

      await this.ffmpeg.exec([
        '-ss', timestamp.toString(),
        '-i', 'input.mp4',
        '-vf', `scale=${settings.width}:${settings.height}`,
        '-vframes', '1',
        '-q:v', settings.quality.toString(),
        outputFilename
      ]);

      const thumbnailData = await this.ffmpeg.readFile(outputFilename) as Uint8Array;
      await window.electronAPI.writeFile(
        outputPath, 
        Buffer.from(thumbnailData.buffer)
      );
      thumbnailPaths.push(outputPath);

      onProgress?.(Math.round((i / count) * 100));
    }

    return thumbnailPaths;
  }

  async deleteThumbnails(thumbnailPaths: string[]): Promise<void> {
    for (const thumbnailPath of thumbnailPaths) {
      const exists = await window.electronAPI.exists(thumbnailPath);
      if (exists) {
        await window.electronAPI.unlink(thumbnailPath);
      }
    }
  }

  async terminate(): Promise<void> {
    if (this.isLoaded) {
      await this.ffmpeg.terminate();
      this.isLoaded = false;
    }
  }
}

export default ThumbnailGenerator;