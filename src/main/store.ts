import { randomUUID } from 'crypto';
import { statSync } from 'fs';
import path from 'path';
import type ElectronStore from 'electron-store';

// 型定義
export interface VideoFile {
    id: string;
    path: string;
    filename: string;
    added: number;
    fileSize: number;
    processingStatus: 'pending' | 'processing' | 'completed' | 'error';
    processingProgress?: number;
    metadata?: {
        duration?: number;
        width?: number;
        height?: number;
        codec?: string;
        bitrate?: number;
    };
    thumbnails?: string[];
}

export interface WatchFolder {
    id: string;
    path: string;
    added: number;
}

export interface StoreSchema {
    videos: VideoFile[];
    watchFolders: WatchFolder[];
    settings: {
        thumbnails: {
            maxCount: number;
            quality: number;
            width: number;
            height: number;
        };
    };
}

class StoreManager {
    private store: ElectronStore<StoreSchema> | null = null;

    async initializeStore(): Promise<void> {
        try {
            const Store = (await import('electron-store')).default;
            this.store = new Store<StoreSchema>({
                name: 'flow-data',
                defaults: {
                    videos: [],
                    watchFolders: [],
                    settings: {
                        thumbnails: {
                            maxCount: 20,
                            quality: 80,
                            width: 320,
                            height: 180
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing store:', error);
            throw error;
        }
    }

    addVideoEntries(filePaths: string[]): VideoFile[] {
        if (!this.store) {
            console.error('Store not initialized');
            return [];
        }

        const existingPaths = new Set(this.getVideos().map(v => v.path));
        const newVideos: VideoFile[] = [];

        for (const filePath of filePaths) {
            if (!existingPaths.has(filePath)) {
                const stats = statSync(filePath);
                const video: VideoFile = {
                    id: randomUUID(),
                    path: filePath,
                    filename: path.basename(filePath),
                    added: Date.now(),
                    fileSize: stats.size,
                    processingStatus: 'processing'
                };

                newVideos.push(video);
            }
        }

        if (newVideos.length > 0) {
            const currentVideos = this.getVideos();
            this.store.set('videos', [...currentVideos, ...newVideos]);
        }

        return newVideos;
    }

    getVideos(): VideoFile[] {
        if (!this.store) {
            console.error('Store not initialized');
            return [];
        }
        return this.store.get('videos') || [];
    }

    updateVideo(videoId: string, updates: Partial<VideoFile>): void {
        if (!this.store) {
            console.error('Store not initialized');
            return;
        }

        const videos = this.getVideos();
        const index = videos.findIndex(v => v.id === videoId);
        if (index !== -1) {
            videos[index] = { ...videos[index], ...updates };
            this.store.set('videos', videos);
        }
    }

    getVideo(id: string): VideoFile | undefined {
        return this.getVideos().find(v => v.id === id);
    }

    getWatchFolders(): WatchFolder[] {
        if (!this.store) {
            console.error('Store not initialized');
            return [];
        }
        return this.store.get('watchFolders');
    }

    getSettings(): StoreSchema['settings'] {
        if (!this.store) {
            console.error('Store not initialized');
            return {
                thumbnails: {
                    maxCount: 20,
                    quality: 80,
                    width: 320,
                    height: 180
                }
            };
        }
        return this.store.get('settings');
    }

    async removeVideo(id: string): Promise<void> {
        if (!this.store) {
            console.error('Store not initialized');
            return;
        }
        const videos = this.getVideos().filter(v => v.id !== id);
        this.store.set('videos', videos);
    }

    addWatchFolder(folderPath: string): WatchFolder | null {
        if (!this.store) {
            console.error('Store not initialized');
            return null;
        }

        const existingFolders = this.getWatchFolders();
        if (existingFolders.some(f => f.path === folderPath)) {
            return null;
        }

        const folder: WatchFolder = {
            id: randomUUID(),
            path: folderPath,
            added: Date.now()
        };

        this.store.set('watchFolders', [...existingFolders, folder]);
        return folder;
    }

    removeWatchFolder(id: string): void {
        if (!this.store) {
            console.error('Store not initialized');
            return;
        }
        const folders = this.getWatchFolders().filter(f => f.id !== id);
        this.store.set('watchFolders', folders);
    }
}

export default StoreManager;