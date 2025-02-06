import { VideoFile } from "src/main/store";
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

export class ThumbnailGenerator {
  constructor(private thumbnailDir: string) {}

  async init(): Promise<void> {
    await fs.mkdir(this.thumbnailDir, { recursive: true });
  }

  async getVideoMetadata(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err: any, metadata: any) => {
        if (err) reject(err);
        else {
          const { duration, width, height, bit_rate } = metadata.streams[0];
          resolve({
            duration,
            width,
            height,
            bitrate: bit_rate,
            codec: metadata.streams[0].codec_name
          });
        }
      });
    });
  }

  async generateThumbnails(
    video: VideoFile,
    options: { maxCount: number; quality: number; width: number; height: number },
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    const videoDir = path.join(this.thumbnailDir, video.id);
    await fs.mkdir(videoDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(video.path, (err: any, metadata: any) => {
        if (err) {
          reject(err);
          return;
        }

        const duration = metadata.format.duration;
        const thumbnails: string[] = [];
        let processed = 0;

        for (let i = 0; i < options.maxCount; i++) {
          const timestamp = (duration * i) / (options.maxCount - 1);
          const outputPath = path.join(videoDir, `thumb_${i}.jpg`);

          ffmpeg(video.path)
            .screenshots({
              timestamps: [timestamp],
              filename: `thumb_${i}.jpg`,
              folder: videoDir,
              size: `${options.width}x${options.height}`
            })
            .on('end', () => {
              thumbnails.push(outputPath);
              processed++;
              
              if (onProgress) {
                onProgress((processed / options.maxCount) * 100);
              }

              if (processed === options.maxCount) {
                resolve(thumbnails);
              }
            })
            .on('error', reject);
        }
      });
    });
  }

  async terminate(): Promise<void> {
    // 必要に応じてクリーンアップ処理を実装
  }
}