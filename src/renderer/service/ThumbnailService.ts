import { VideoFile } from '../../types/store';
import { ThumbnailGenerator } from '../utils/ThumbnailGenerator';
import path from 'path';

class ThumbnailService {
  private generator: ThumbnailGenerator | null = null;
  private thumbnailDir: string | null = null;

  async init() {
    if (!this.generator) {
      this.thumbnailDir = path.join(
        await window.electronAPI.getUserDataPath(),
        'thumbnails'
      );
      await window.electronAPI.mkdir(this.thumbnailDir);
      this.generator = new ThumbnailGenerator(this.thumbnailDir);
      await this.generator.init();
    }
  }

  async processVideo(video: VideoFile, onProgress?: (progress: number) => void) {
    await this.init();
    if (!this.generator) throw new Error('ThumbnailGenerator not initialized');

    try {
      // メタデータの取得
      const metadata = await this.generator.getVideoMetadata(video.path);
      onProgress?.(30);

      // サムネイルの生成
      const thumbnails = await this.generator.generateThumbnails(
        video,
        {
          maxCount: 20,
          quality: 80,
          width: 320,
          height: 180
        },
        (progress: number) => onProgress?.(30 + (progress * 0.7))
      );

      // メタデータとサムネイルパスを保存
      await window.electronAPI.updateVideoMetadata(video.id, metadata, thumbnails);

      return { metadata, thumbnails };
    } catch (error) {
      console.error('Error processing video:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.generator) {
      await this.generator.terminate();
      this.generator = null;
    }
  }
}

export default new ThumbnailService();