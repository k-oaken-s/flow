export type ProcessingStatus = 'processing' | 'completed' | 'error';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
}

export interface VideoFile {
  id: string;
  path: string;
  filename: string;
  added: number;
  fileSize: number;
  thumbnails?: string[];
  metadata?: VideoMetadata;
  processingStatus?: ProcessingStatus;
  processingProgress?: number;
}

export interface WatchFolder {
  id: string;
  path: string;
  added: number;
}

export interface ThumbnailSettings {
  maxCount: number;
  quality: number;
  width: number;
  height: number;
}

export interface Settings {
  thumbnails: ThumbnailSettings;
}

export interface StoreSchema {
  videos: VideoFile[];
  watchFolders: WatchFolder[];
  settings: Settings;
}