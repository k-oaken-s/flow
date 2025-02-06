import React, { useEffect, useState } from 'react';
import Header from './Header';
import VideoCard from './VideoCard';
import { VideoFile } from '../../types/store';

const MainContent: React.FC = () => {
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [sortBy, setSortBy] = useState<'filename' | 'added' | 'playCount'>('added');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const loadVideos = async () => {
        try {
            setIsLoading(true);
            let videoList = await window.electronAPI.getVideos();

            // 並び替え
            videoList = [...videoList].sort((a, b) => {
                let comparison = 0;
                switch (sortBy) {
                    case 'filename':
                        comparison = a.filename.localeCompare(b.filename);
                        break;
                    case 'playCount':
                        comparison = (b.playCount || 0) - (a.playCount || 0);
                        break;
                    case 'added':
                    default:
                        comparison = b.added - a.added;
                        break;
                }
                return sortOrder === 'asc' ? -comparison : comparison;
            });

            setVideos(videoList);
        } catch (error) {
            console.error('Error loading videos:', error);
            setVideos([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVideos();
    }, [sortBy, sortOrder]);


    useEffect(() => {
        loadVideos();

        // プログレス更新のリスナーを設定
        const unsubscribeVideosUpdated = window.electronAPI.onVideosUpdated(() => {
            loadVideos();
        });
        // プログレス更新のリスナーを設定
        const unsubscribeProgress = window.electronAPI.onThumbnailProgress(({ videoId, progress }) => {
            setVideos(currentVideos =>
                currentVideos.map(video =>
                    video.id === videoId
                        ? { ...video, processingProgress: progress }
                        : video
                )
            );
        });

        return () => {
            unsubscribeVideosUpdated();
            unsubscribeProgress();
        };
    }, []);

    const handleDeleteVideo = async (id: string) => {
        if (window.confirm('このビデオを削除してもよろしいですか？')) {
            try {
                await window.electronAPI.removeVideo(id);
                await loadVideos();
            } catch (error) {
                console.error('Error deleting video:', error);
            }
        }
    };

    const handleRetry = async (id: string) => {
        try {
            await window.electronAPI.retryThumbnails(id);
            await loadVideos();
        } catch (error) {
            console.error('Error retrying thumbnails:', error);
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen bg-gray-50 dark:bg-gray-900">
            <Header onVideosUpdated={loadVideos} />

            {/* ソートコントロール */}
            <div className="px-6 py-2 flex justify-end space-x-2">
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                    <option value="added">追加日時</option>
                    <option value="filename">ファイル名</option>
                    <option value="playCount">再生回数</option>
                </select>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                    className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                    <option value="desc">降順</option>
                    <option value="asc">昇順</option>
                </select>
            </div>

            <div className="flex-1 p-6 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p className="mb-4">動画が追加されていません</p>
                        <button
                            onClick={() => window.electronAPI.selectFiles()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            動画を追加
                        </button>
                    </div>
                ) : (
                    // グリッドを単一カラムのスタックレイアウトに変更
                    <div className="space-y-6">
                        {videos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onDelete={handleDeleteVideo}
                                onRetry={handleRetry}
                                onUpdated={loadVideos}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainContent;