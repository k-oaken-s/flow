import React, { useState, useEffect } from 'react';

interface ProcessingVideo {
    id: string;
    filename: string;
    progress: number;
}

const ProcessingStatus: React.FC = () => {
    const [processingVideos, setProcessingVideos] = useState<ProcessingVideo[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        // 初期状態で処理中の動画を取得
        const loadProcessingVideos = async () => {
            try {
                const videos = await window.electronAPI.getVideos();
                const processing = videos
                    .filter(v => v.processingStatus === 'processing')
                    .map(v => ({
                        id: v.id,
                        filename: v.filename,
                        progress: v.processingProgress || 0
                    }));
                setProcessingVideos(processing);

                // 処理中の総数と完了数を計算
                if (processing.length > 0) {
                    setTotalCount(processing.length);
                    const completed = videos.filter(v =>
                        v.processingStatus === 'completed' &&
                        v.added >= Math.min(...processing.map(p => p.added))
                    ).length;
                    setCompletedCount(completed);
                } else {
                    setTotalCount(0);
                    setCompletedCount(0);
                }
            } catch (error) {
                console.error('Error loading processing videos:', error);
            }
        };
        loadProcessingVideos();

        // 進捗更新の購読
        const unsubscribeProgress = window.electronAPI.onThumbnailProgress(({ videoId, progress }) => {
            setProcessingVideos(current => {
                const updated = current.map(video =>
                    video.id === videoId
                        ? { ...video, progress }
                        : video
                );
                // 100%完了したものを除去
                return updated.filter(video => video.progress < 100);
            });
        });

        // 新しい動画が追加された時の処理
        const unsubscribeVideosUpdated = window.electronAPI.onVideosUpdated(loadProcessingVideos);

        return () => {
            unsubscribeProgress();
            unsubscribeVideosUpdated();
        };
    }, []);

    if (processingVideos.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 z-50">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="animate-spin">⚙️</span>
                    <span>サムネイル生成中... ({completedCount}/{totalCount})</span>
                </div>
                <div className="text-sm text-gray-300">
                    {processingVideos.map(video => (
                        <div key={video.id} className="flex items-center space-x-2">
                            <span>{video.filename}</span>
                            <span>{video.progress}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProcessingStatus;