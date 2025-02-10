import StoreManager, { VideoFile, initializeStore, getStore } from './store';
import type { FSWatcher } from 'chokidar';
import { app, BrowserWindow, ipcMain, dialog, shell, Menu, MenuItemConstructorOptions } from 'electron';
import { promisify } from 'util';

const path = require('path');
const fs = require('fs');  // 通常のfsを使用
let sharp;
try {
  const arch = process.arch;
  if (process.platform === 'darwin') {
    if (arch === 'arm64') {
      sharp = require('@img/sharp-darwin-arm64');
    } else {
      sharp = require('@img/sharp-darwin-x64');
    }
  } else {
    // Windowsの場合は通常のsharpを使用
    sharp = require('sharp');
  }
} catch (error) {
  console.error('Failed to load sharp:', error);
  // エラーハンドリング
}
const ffmpeg = require('fluent-ffmpeg');
const chokidar = require('chokidar');

// グローバル定数の定義
const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv'];
const defaultThumbnailSettings = {
    maxCount: 20,
    quality: 80,
    width: 320,
    height: 180
};

let watchers: FSWatcher[] = [];

let mainWindow: BrowserWindow | null = null;
let storeManager: StoreManager | null = null;
let isDarkMode = false;  // 初期値をfalseに設定

const readdirAsync = promisify(fs.readdir);
const mkdirAsync = promisify(fs.mkdir);

async function generateThumbnails(
  videoId: string,
  videoPath: string,
  outputDir: string,
  options: { maxCount: number; quality: number; width: number; height: number }
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, async (err: any, metadata: any) => {
      if (err) {
        console.error('Error probing video:', err);
        reject(err);
        return;
      }

      const duration = metadata.format.duration;
      if (!duration) {
        console.error('No duration found in video metadata');
        reject(new Error('No duration found in video metadata'));
        return;
      }

      const thumbnails: string[] = [];
      const BATCH_SIZE = 4;
      let totalProcessed = 0;

      const timestamps = Array.from({ length: options.maxCount }, (_, i) => {
        return Math.max(0, Math.min(duration * (i / (options.maxCount - 1)), duration - 0.1));
      });

      const processBatch = async (startIndex: number, endIndex: number) => {
        const batchTimestamps = timestamps.slice(startIndex, endIndex);
        const batchPromises = batchTimestamps.map((timestamp, i) => {
          return new Promise<string>((resolveThumb, rejectThumb) => {
            const currentIndex = startIndex + i;
            const outputPath = path.join(outputDir, `thumb_${currentIndex}.jpg`);
            console.log(`Generating thumbnail ${currentIndex + 1}/${options.maxCount} at ${timestamp}s`);

            ffmpeg(videoPath)
              .screenshots({
                timestamps: [timestamp],
                filename: `thumb_${currentIndex}.jpg`,
                folder: outputDir,
                size: `${options.width}x${options.height}`,
                fastSeek: true,
              })
              .on('end', () => {
                totalProcessed++;
                console.log(`Thumbnail ${currentIndex + 1}/${options.maxCount} generated successfully`);
                mainWindow?.webContents.send('thumbnail-progress', {
                  videoId,
                  progress: (totalProcessed / options.maxCount) * 100
                });
                resolveThumb(outputPath);
              })
              .on('error', (err: Error) => {
                console.error(`Error generating thumbnail ${currentIndex + 1}:`, err);
                rejectThumb(err);
              });
          });
        });

        try {
          const results = await Promise.allSettled(batchPromises);
          results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
              thumbnails[startIndex + i] = result.value;
            }
          });
        } catch (error) {
          console.error('Error in batch:', error);
        }
      };

      try {
        for (let i = 0; i < timestamps.length; i += BATCH_SIZE) {
          await processBatch(i, Math.min(i + BATCH_SIZE, timestamps.length));
          // バッチ間で少し待機
          await new Promise(r => setTimeout(r, 500));
        }

        // 空の要素を除去して結果を返す
        const validThumbnails = thumbnails.filter(t => t);
        if (validThumbnails.length > 0) {
          console.log(`Generated ${validThumbnails.length}/${options.maxCount} thumbnails successfully`);
          resolve(validThumbnails);
        } else {
          reject(new Error('No thumbnails were generated successfully'));
        }
      } catch (error) {
        console.error('Error in thumbnail generation:', error);
        const validThumbnails = thumbnails.filter(t => t);
        if (validThumbnails.length > 0) {
          console.log(`Partially succeeded: Generated ${validThumbnails.length}/${options.maxCount} thumbnails`);
          resolve(validThumbnails);
        } else {
          reject(error);
        }
      }
    });
  });
}

async function scanWatchFolder(folderPath) {
  try {
      async function scanDirectory(dir) {
          const entries = await readdirAsync(dir, { withFileTypes: true });
          
          for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              
              if (entry.isDirectory()) {
                  await scanDirectory(fullPath);
              } else if (entry.isFile()) {
                  const ext = path.extname(entry.name).toLowerCase();
                  if (videoExtensions.includes(ext)) {
                      const newVideos = storeManager.addVideoEntries([fullPath]);
                      
                      for (const video of newVideos) {
                          try {
                              const outputDir = path.join(app.getPath('userData'), 'thumbnails', video.id);
                              await mkdirAsync(outputDir, { recursive: true });

                              const thumbnails = await generateThumbnails(
                                  video.id,
                                  video.path,
                                  outputDir,
                                  defaultThumbnailSettings
                              );

                              storeManager.updateVideo(video.id, {
                                  thumbnails,
                                  processingStatus: 'completed',
                                  processingProgress: 100
                              });

                              if (mainWindow) {
                                  mainWindow.webContents.send('videos-updated');
                              }
                          } catch (error) {
                              console.error(`Error processing video ${video.filename}:`, error);
                              storeManager.updateVideo(video.id, {
                                  processingStatus: 'error'
                              });
                          }
                      }
                  }
              }
          }
      }

      await scanDirectory(folderPath);
      console.log(`Finished scanning folder: ${folderPath}`);
  } catch (error) {
      console.error('Error scanning watch folder:', error);
      throw error;
  }
}

// scanAllWatchFolders関数を修正
async function scanAllWatchFolders() {
  try {
      const folders = storeManager.getWatchFolders();
      console.log('Found watch folders:', folders);
      
      for (const folder of folders) {
          console.log(`Scanning folder: ${folder.path}`);
          await scanWatchFolder(folder.path);
      }
  } catch (error) {
      console.error('Error scanning watch folders:', error);
      throw error;
  }
}

// setupWatchFolders関数を修正
function setupWatchFolders() {
  try {
      // 既存のwatchersをクリーンアップ
      if (watchers.length > 0) {
          console.log('Cleaning up existing watchers');
          watchers.forEach(watcher => watcher.close());
          watchers = [];
      }

      const folders = storeManager.getWatchFolders();
      console.log('Setting up watchers for folders:', folders);

      folders.forEach(folder => {
          console.log(`Setting up watcher for folder: ${folder.path}`);
          
          const watcher = chokidar.watch(folder.path, {
              ignored: /(^|[\/\\])\../, // 隠しファイルを無視
              persistent: true,
              depth: 99 // サブディレクトリの深さ
          });

          watcher
              .on('ready', () => {
                  console.log(`Watcher ready for ${folder.path}`);
              })
              .on('add', async (filePath) => {
                  const ext = path.extname(filePath).toLowerCase();
                  if (videoExtensions.includes(ext)) {
                      console.log(`New video detected: ${filePath}`);
                      const newVideos = storeManager.addVideoEntries([filePath]);
                      
                      for (const video of newVideos) {
                          try {
                              const outputDir = path.join(app.getPath('userData'), 'thumbnails', video.id);
                              await fs.mkdir(outputDir, { recursive: true });

                              const thumbnails = await generateThumbnails(
                                  video.id,
                                  video.path,
                                  outputDir,
                                  defaultThumbnailSettings
                              );

                              storeManager.updateVideo(video.id, {
                                  thumbnails,
                                  processingStatus: 'completed',
                                  processingProgress: 100
                              });

                              if (mainWindow) {
                                  mainWindow.webContents.send('videos-updated');
                              }
                          } catch (error) {
                              console.error(`Error processing new video ${video.filename}:`, error);
                              storeManager.updateVideo(video.id, {
                                  processingStatus: 'error'
                              });
                          }
                      }
                  }
              })
              .on('error', error => {
                  console.error(`Watcher error for ${folder.path}:`, error);
              });

          watchers.push(watcher);
      });
  } catch (error) {
      console.error('Error setting up watch folders:', error);
      throw error;
  }
}

// ストアの初期化関数を修正
async function initializeApp() {
    try {
        storeManager = await initializeStore();
        isDarkMode = storeManager.getTheme().isDarkMode;
        return true;
    } catch (error) {
        console.error('Failed to initialize app:', error);
        throw error;
    }
}

function createWindow() {
  console.log('Creating window...');
  
  const preloadPath = path.join(__dirname, '..', 'preload', 'index.js');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      devTools: true,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.webContents.openDevTools({ mode: 'detach' });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Load failure:', errorCode, errorDescription);
  });

  console.log('Preload script path:', preloadPath);

  // メニューバーの作成
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: 'ファイルを追加',
          click: () => {
            mainWindow?.webContents.send('menu-select-files');
          }
        },
        {
          label: 'フォルダを追加',
          click: () => {
            mainWindow?.webContents.send('menu-select-folder');
          }
        },
        { type: 'separator' },
        {
          label: 'データをリセット',
          click: () => {
            mainWindow?.webContents.send('menu-reset-data');
          }
        },
        { type: 'separator' },
        { role: 'quit', label: '終了' }
      ]
    },
    {
        label: 'タグ',
        submenu: [
            {
                label: 'タグ管理',
                click: () => {
                    mainWindow?.webContents.send('menu-open-tag-manager');
                }
            }
        ]
    },
    {
        label: '表示',
        submenu: [
            {
                label: 'ダークモード',
                type: 'checkbox',
                checked: isDarkMode,
                click: (menuItem) => {
                    isDarkMode = menuItem.checked;
                    storeManager?.setTheme(isDarkMode);
                    mainWindow?.webContents.send('menu-toggle-theme', isDarkMode);
                }
            },
            { type: 'separator' },
            { role: 'reload', label: 'リロード' },
            { role: 'forceReload', label: '強制リロード' },
            { role: 'toggleDevTools', label: '開発者ツール' },
        ]
    },
    {
        label: 'ヘルプ',
        submenu: [
            {
                label: 'データフォルダを開く',
                click: () => {
                    mainWindow?.webContents.send('menu-open-store-path');
                }
            },
            { type: 'separator' },
            {
                label: 'バージョン情報',
                click: () => {
                    mainWindow?.webContents.send('menu-show-version');
                }
            }
        ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // テーマ変更時の処理を修正
  ipcMain.on('theme-changed', (_, dark: boolean) => {
    isDarkMode = dark;
    storeManager?.setTheme(isDarkMode);
    const menu = Menu.getApplicationMenu();
    const viewMenu = menu?.items.find(item => item.label === '表示');
    const darkModeItem = viewMenu?.submenu?.items.find(item => item.label === 'ダークモード');
    if (darkModeItem) {
      darkModeItem.checked = isDarkMode;
    }
  });

  // ウィンドウの読み込み完了時の処理を一箇所にまとめる
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
    // 初期テーマをレンダラーに通知
    mainWindow?.webContents.send('menu-toggle-theme', isDarkMode);
  });

  const indexPath = path.join(__dirname, '..', 'index.html');
  console.log('Loading index from:', indexPath);
  mainWindow.loadFile(indexPath);
}

function setupIpcHandlers() {
  ipcMain.handle('select-files', async () => {
    if (!mainWindow || !storeManager) return [];
    
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv'] }]
      });
  
      if (!result.canceled && result.filePaths.length > 0) {
        console.log('Selected files:', result.filePaths);
        
        const newVideos = storeManager.addVideoEntries(result.filePaths);
        console.log('Added new videos:', newVideos);
        
        if (newVideos.length > 0) {
          // サムネイル生成を開始
          for (const video of newVideos) {
            console.log('Starting thumbnail generation for video:', video.id);
            
            // メインプロセスでサムネイル生成を実行
            const thumbnailDir = path.join(app.getPath('userData'), 'thumbnails', video.id);
            await fs.promises.mkdir(thumbnailDir, { recursive: true });
            
            try {
              const metadata = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(video.path, (err: any, metadata: any) => {
                  if (err) reject(err);
                  else resolve({
                    duration: metadata.format.duration,
                    width: metadata.streams[0].width,
                    height: metadata.streams[0].height,
                    codec: metadata.streams[0].codec_name,
                    bitrate: metadata.format.bit_rate
                  });
                });
              });
            
              const settings = storeManager.getSettings().thumbnails;
              const thumbnails = await generateThumbnails(video.id, video.path, thumbnailDir, settings);
            
              // 少なくとも1つのサムネイルが生成できた場合は成功とする
              if (thumbnails.length > 0) {
                storeManager.updateVideo(video.id, {
                  metadata,
                  thumbnails,
                  processingStatus: 'completed',
                  processingProgress: 100
                });
              } else {
                storeManager.updateVideo(video.id, {
                  processingStatus: 'error'
                });
              }
            } catch (error) {
              console.error('Error generating thumbnails:', error);
              storeManager.updateVideo(video.id, {
                processingStatus: 'error'
              });
            }
          }
  
          mainWindow?.webContents.send('videos-updated');
        }
  
        return newVideos;
      }
  
      return [];
    } catch (error) {
      console.error('Error in select-files handler:', error);
      throw error;
    }
  });

  ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

  ipcMain.handle('get-videos', () => {
    if (!storeManager) {
      console.error('StoreManager not initialized');
      return [];
    }
    return storeManager.getVideos();
  });

ipcMain.handle('get-watch-folders', () => {
    if (!storeManager) {
        console.error('StoreManager not initialized');
        return [];
    }
    return storeManager.getWatchFolders();
});

  ipcMain.handle('add-watch-folder', async (_, folderPath: string) => {
    try {
        if (!storeManager) {
            throw new Error('StoreManager not initialized');
        }
        const folder = storeManager.addWatchFolder(folderPath);
        if (!folder) {
            console.log('Folder already exists:', folderPath);
            return null;
        }
        return folder;
    } catch (error) {
        console.error('Error adding watch folder:', error);
        throw error;
    }
 });

 ipcMain.handle('remove-watch-folder', async (_, id: string) => {
  if (!storeManager) {
      throw new Error('StoreManager not initialized');
  }
  await storeManager.removeWatchFolder(id);
  // 監視フォルダが更新されたことを通知
  mainWindow?.webContents.send('watch-folders-updated');
  return true;
});

ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return null;
    
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const folderPath = result.filePaths[0];
            const folder = storeManager.addWatchFolder(folderPath);
            
            if (folder) {
                // まず動画ファイルを追加して即座に通知
                const newVideos = await addVideosFromFolder(folderPath);
                mainWindow.webContents.send('videos-updated');

                // サムネイル生成は非同期で並行処理
                newVideos.forEach(async (video) => {
                    try {
                        const outputDir = path.join(app.getPath('userData'), 'thumbnails', video.id);
                        await fs.promises.mkdir(outputDir, { recursive: true });

                        // 処理状態を'processing'に設定
                        await storeManager.updateVideo(video.id, {
                            processingStatus: 'processing',
                            processingProgress: 0
                        });
                        mainWindow.webContents.send('videos-updated');

                        // サムネイル生成を開始
                        const thumbnails = await generateThumbnails(
                            video.id,
                            video.path,
                            outputDir,
                            defaultThumbnailSettings
                        );

                        // サムネイル生成完了後、確実に更新
                        await storeManager.updateVideo(video.id, {
                            thumbnails,
                            processingStatus: 'completed',
                            processingProgress: 100
                        });

                        // 更新後に通知
                        mainWindow.webContents.send('videos-updated');
                    } catch (error) {
                        console.error(`Error processing video ${video.filename}:`, error);
                        await storeManager.updateVideo(video.id, {
                            processingStatus: 'error'
                        });
                        mainWindow.webContents.send('videos-updated');
                    }
                });
            }
            
            return folder;
        } catch (error) {
            console.error('Error adding watch folder:', error);
            throw error;
        }
    }
    
    return null;
});

async function scanWatchFolder(folderPath: string) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const videoExtensions = ['.mp4', '.avi', '.mkv', '.mov', '.wmv'];

  try {
      async function scanDirectory(dir: string) {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              
              if (entry.isDirectory()) {
                  await scanDirectory(fullPath);
              } else if (entry.isFile()) {
                  const ext = path.extname(entry.name).toLowerCase();
                  if (videoExtensions.includes(ext)) {
                      const newVideos = storeManager.addVideoEntries([fullPath]);
                      
                      // 追加された各動画に対してサムネイル生成を開始
                      for (const video of newVideos) {
                          try {
                              // サムネイル保存用のディレクトリを作成
                              const outputDir = path.join(app.getPath('userData'), 'thumbnails', video.id);
                              await fs.mkdir(outputDir, { recursive: true });

                              // デフォルトの設定を定義
                              const thumbnailSettings = {
                                  maxCount: 20,
                                  quality: 80,
                                  width: 320,
                                  height: 180
                              };

                              // サムネイル生成
                              const thumbnails = await generateThumbnails(
                                  video.id,
                                  video.path,
                                  outputDir,
                                  thumbnailSettings
                              );

                              // 生成したサムネイルを保存
                              storeManager.updateVideo(video.id, {
                                  thumbnails,
                                  processingStatus: 'completed',
                                  processingProgress: 100
                              });

                              // UI更新のため通知
                              mainWindow?.webContents.send('videos-updated');
                          } catch (error) {
                              console.error(`Error processing video ${video.filename}:`, error);
                              storeManager.updateVideo(video.id, {
                                  processingStatus: 'error'
                              });
                          }
                      }
                  }
              }
          }
      }

      await scanDirectory(folderPath);
      console.log(`Finished scanning folder: ${folderPath}`);
  } catch (error) {
      console.error('Error scanning watch folder:', error);
      throw error;
  }
}

  ipcMain.handle('update-video-metadata', async (_, videoId, metadata, thumbnails) => {
    const videos = storeManager.getVideos();
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex !== -1) {
      videos[videoIndex] = {
        ...videos[videoIndex],
        metadata,
        thumbnails,
        processingStatus: 'completed',
        processingProgress: 100
      };
      storeManager.setVideos(videos);
    }
  });

  ipcMain.handle('remove-video', async (_, id) => {
    const videos = storeManager.getVideos().filter(v => v.id !== id);
    storeManager.setVideos(videos);
  });

  ipcMain.handle('retry-thumbnails', async (_, id) => {
    try {
      // サムネイル再生成の処理
    } catch (error) {
      console.error('Failed to retry thumbnails:', error);
    }
  });

  async function createThumbnail(videoPath: string, thumbnailPath: string) {
    try {
      await sharp(videoPath)
        .resize(320, 180)
        .toFile(thumbnailPath);
      console.log('Thumbnail created successfully');
    } catch (error) {
      console.error('Error creating thumbnail:', error);
    }
  }
  
  ipcMain.handle('add-video', async (event, videoPath: string) => {
    try {
      const thumbnailPath = path.join(path.dirname(videoPath), 'thumbnail.jpg');
      await createThumbnail(videoPath, thumbnailPath);
      storeManager.addVideo(videoPath, thumbnailPath);
      console.log('Added 1 new video');
    } catch (error) {
      console.error('Error adding video:', error);
    }
  });

  ipcMain.handle('debug-store', () => {
    try {
      const userDataPath = app.getPath('userData');
      const storePath = path.join(userDataPath, 'flow-data.json');
      console.log('Store file path:', storePath);
      
      // ファイルの内容を読み取り
      const content = fs.readFileSync(storePath, 'utf8');
      console.log('Store content:', JSON.parse(content));
      
      return {
        path: storePath,
        content: JSON.parse(content)
      };
    } catch (error) {
      console.error('Error reading store:', error);
      return null;
    }
  });

 // 動画を開くハンドラーを追加
 ipcMain.handle('open-video', async (_, path) => {
  try {
      await shell.openPath(path);
      return true;
  } catch (error) {
      console.error('Error opening video:', error);
      return false;
  }
});

// 再生回数を更新するハンドラーも追加
ipcMain.handle('increment-play-count', async (_, videoId) => {
  try {
      if (!storeManager) {
          throw new Error('StoreManager not initialized');
      }
      await storeManager.incrementPlayCount(videoId);
      return true;
  } catch (error) {
      console.error('Error incrementing play count:', error);
      return false;
  }
});

ipcMain.handle('toggle-favorite', async (_, videoId) => {
  try {
      storeManager.toggleFavorite(videoId);
      return true;
  } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
  }
});

ipcMain.handle('get-tags', () => {
  return storeManager.getTags();
});

ipcMain.handle('add-tag', async (_, name: string, color: string) => {
  try {
      const newTag = storeManager.addTag(name, color);
      return newTag;
  } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
  }
});

ipcMain.handle('remove-tag', async (_, tagId: string) => {
  try {
      await storeManager.removeTag(tagId);
      return true;
  } catch (error) {
      console.error('Error removing tag:', error);
      throw error;
  }
});

ipcMain.handle('update-video-tags', async (_, videoId: string, tagIds: string[]) => {
  try {
      await storeManager.updateVideoTags(videoId, tagIds);
      return true;
  } catch (error) {
      console.error('Error updating video tags:', error);
      throw error;
  }
});

ipcMain.handle('notify-tags-updated', () => {
  mainWindow?.webContents.send('tags-updated');
});

ipcMain.handle('notify-filter-changed', (_, options: FilterOptions) => {
  try {
      mainWindow?.webContents.send('filter-changed', options);
      return true;
  } catch (error) {
      console.error('Error notifying filter change:', error);
      return false;
  }
});
ipcMain.handle('get-statistics', async () => {
  const videos = storeManager.getVideos();
  return {
      totalVideos: videos.length,
      totalDuration: videos.reduce((sum, video) => sum + (video.metadata?.duration || 0), 0),
      totalSize: videos.reduce((sum, video) => sum + video.fileSize, 0),
      totalPlayCount: videos.reduce((sum, video) => sum + (video.playCount || 0), 0),
  };
});

ipcMain.handle('reset-store', () => {
    try {
        resetStore();
    } catch (error) {
        console.error('Error in reset-store handler:', error);
        throw error;
    }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('open-store-path', async () => {
  const storePath = app.getPath('userData');
  await shell.openPath(storePath);
});

ipcMain.handle('get-video', async (_, videoId: string) => {
    return storeManager.getVideo(videoId);
});

// 初期テーマを返すハンドラー
ipcMain.handle('request-initial-theme', () => {
    return isDarkMode;
});

};

function setupFfmpeg() {
  try {
    const ffmpegPath = require('ffmpeg-static');
    const ffprobePath = require('ffprobe-static').path;
    
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
    
    console.log('FFmpeg paths set successfully');
    console.log('FFmpeg path:', ffmpegPath);
    console.log('FFprobe path:', ffprobePath);
  } catch (error) {
    console.error('Error setting up FFmpeg:', error);
  }
}


app.whenReady().then(async () => {
  try {
    console.log('Initializing store...');
    await initializeApp();
    
    console.log('Creating window...');
    createWindow();
    
    // メニューの初期状態を設定
    const menu = Menu.getApplicationMenu();
    const viewMenu = menu?.items.find(item => item.label === '表示');
    const darkModeItem = viewMenu?.submenu?.items.find(item => item.label === 'ダークモード');
    if (darkModeItem) {
        darkModeItem.checked = isDarkMode;
    }
    
    console.log('Setting up IPC handlers...');
    setupIpcHandlers();

    console.log('Scanning watch folders...');
    await scanAllWatchFolders();
    
    console.log('Setting up watch folder monitoring...');
    setupWatchFolders();

  } catch (error) {
    console.error('Failed to initialize app:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
    watchers.forEach(watcher => watcher.close());
});

module.exports = {
  createWindow,
  setupIpcHandlers
};

// 動画ファイルの追加のみを行う関数
async function addVideosFromFolder(folderPath: string) {
    const newVideos: VideoFile[] = [];
    
    async function scanDirectory(dir: string) {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                await scanDirectory(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (videoExtensions.includes(ext)) {
                    const addedVideos = storeManager.addVideoEntries([fullPath]);
                    newVideos.push(...addedVideos);
                }
            }
        }
    }

    await scanDirectory(folderPath);
    return newVideos;
}