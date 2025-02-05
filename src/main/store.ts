import Store from 'electron-store';
import { StoreSchema, VideoFile, WatchFolder } from '../types/store.js';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv'];

class StoreManager {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'flow-data',
      defaults: {
        videos: [],
        watchFolders: []
      }
    });
  }

  // ビデオファイルの追加
  addVideos(filePaths: string[]): VideoFile[] {
    const existingPaths = new Set(this.getVideos().map(v => v.path));
    const newVideos: VideoFile[] = [];

    filePaths.forEach(filePath => {
      if (!existingPaths.has(filePath)) {
        const stats = fs.statSync(filePath);
        const video: VideoFile = {
          id: crypto.randomUUID(),
          path: filePath,
          filename: path.basename(filePath),
          added: Date.now(),
          fileSize: stats.size
        };
        newVideos.push(video);
      }
    });

    if (newVideos.length > 0) {
      const currentVideos = this.getVideos();
      this.store.set('videos', [...currentVideos, ...newVideos]);
    }

    return newVideos;
  }

  // 監視フォルダの追加
  addWatchFolder(folderPath: string): WatchFolder | null {
    const existingFolders = this.getWatchFolders();
    if (existingFolders.some(f => f.path === folderPath)) {
      return null;
    }

    const folder: WatchFolder = {
      id: crypto.randomUUID(),
      path: folderPath,
      added: Date.now()
    };

    this.store.set('watchFolders', [...existingFolders, folder]);

    // フォルダ内の動画ファイルを追加
    const videoFiles = this.scanFolderForVideos(folderPath);
    this.addVideos(videoFiles);

    return folder;
  }

  // フォルダ内の動画ファイルをスキャン
  private scanFolderForVideos(folderPath: string): string[] {
    const videoFiles: string[] = [];
    
    const scanDir = (dirPath: string) => {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (VIDEO_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
          videoFiles.push(fullPath);
        }
      });
    };

    scanDir(folderPath);
    return videoFiles;
  }

  // 全てのビデオを取得
  getVideos(): VideoFile[] {
    return this.store.get('videos');
  }

  // 監視フォルダを取得
  getWatchFolders(): WatchFolder[] {
    return this.store.get('watchFolders');
  }

  // ビデオの削除
  removeVideo(id: string) {
    const currentVideos = this.getVideos();
    const updatedVideos = currentVideos.filter(v => v.id !== id);
    this.store.set('videos', updatedVideos);
  }

  // 監視フォルダの削除
  removeWatchFolder(id: string) {
    const currentFolders = this.getWatchFolders();
    const updatedFolders = currentFolders.filter(f => f.id !== id);
    this.store.set('watchFolders', updatedFolders);
  }
}

export default StoreManager;