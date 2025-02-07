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
  playCount: number;
  lastPlayed?: number;
  thumbnails?: string[];
  metadata?: VideoMetadata;
  processingStatus?: ProcessingStatus;
  processingProgress?: number;
  isFavorite?: boolean;
  tagIds: string[];
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
  tags: Tag[]; 
  settings: Settings;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}