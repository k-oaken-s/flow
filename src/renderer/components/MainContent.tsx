import React, { useEffect, useState } from 'react';
import Header from './Header';
import VideoCard from './VideoCard';
import { VideoFile } from '../../types/store';

const MainContent: React.FC = () => {
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadVideos = async () => {
        try {
            setIsLoading(true);
            console.log('Attempting to get videos', window.electronAPI); // デバッグログ

            // windowオブジェクトとgetVideosメソッドの存在を確認
            if (!window.electronAPI || typeof window.electronAPI.getVideos !== 'function') {
                console.error('getVideos method is not available');
                setVideos([]);
                return;
            }

            const videoList = await window.electronAPI.getVideos();
            console.log('Retrieved videos:', videoList); // デバッグログ
            setVideos(videoList);
        } catch (error) {
            console.error('Error loading videos:', error);
            setVideos([]); // エラー時に空の配列をセット
        } finally {
            setIsLoading(false);
        }
    };

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
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MainContent;