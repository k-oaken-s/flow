import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingVideo {
    id: string;
    filename: string;
    progress: number;
}

const ProcessingStatus: React.FC = () => {
    const [processingVideos, setProcessingVideos] = useState<ProcessingVideo[]>([]);
    const totalCount = processingVideos.length;
    const completedCount = processingVideos.filter(v => v.progress === 100).length;

    useEffect(() => {
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
            } catch (error) {
                console.error('Error loading processing videos:', error);
            }
        };

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

        loadProcessingVideos();

        return () => {
            unsubscribeProgress();
            unsubscribeVideosUpdated();
        };
    }, []);

    if (processingVideos.length === 0) {
        return null;
    }

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="max-w-7xl mx-auto p-3">
                <div className="flex items-center justify-between">
                    {/* 左側: 全体の進捗状況 */}
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            <span className="font-medium">サムネイル生成中</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {completedCount}/{totalCount}
                        </div>
                    </div>

                    {/* 右側: 個別の進捗状況 */}
                    <div className="flex items-center space-x-4">
                        {processingVideos.map(video => (
                            <div key={video.id} className="flex items-center space-x-2">
                                <div className="max-w-[200px]">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                        {video.filename}
                                    </div>
                                    <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                                            style={{ width: `${video.progress}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px]">
                                    {video.progress}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessingStatus;