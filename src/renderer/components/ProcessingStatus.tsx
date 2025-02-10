import React, { useEffect, useState } from 'react';
import { Loader2, ChevronUp } from 'lucide-react';

interface ProcessingVideo {
    id: string;
    filename: string;
    progress: number;
}

const ProcessingStatus: React.FC = () => {
    const [processingVideos, setProcessingVideos] = useState<ProcessingVideo[]>([]);
    const [completedCount, setCompletedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

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

                // 全体の動画数を設定
                setTotalCount(videos.length);
                // 完了した動画数を計算
                const completed = videos.filter(v => v.processingStatus === 'completed').length;
                setCompletedCount(completed);
                setProcessingVideos(processing);
            } catch (error) {
                console.error('Error loading processing videos:', error);
            }
        };

        // 初期ロード
        loadProcessingVideos();

        // 進捗更新の購読
        const unsubscribeProgress = window.electronAPI.onThumbnailProgress(({ videoId, progress }) => {
            setProcessingVideos(current => {
                const updated = current.map(video =>
                    video.id === videoId
                        ? { ...video, progress }
                        : video
                );
                // 100%完了した動画があれば完了カウントを増やす
                const newlyCompleted = updated.filter(v => v.progress === 100).length;
                if (newlyCompleted > 0) {
                    setCompletedCount(prev => prev + newlyCompleted);
                }
                return updated.filter(video => video.progress < 100);
            });
        });

        // 動画一覧の更新を監視
        const unsubscribeVideosUpdated = window.electronAPI.onVideosUpdated(loadProcessingVideos);

        return () => {
            unsubscribeProgress();
            unsubscribeVideosUpdated();
        };
    }, []);

    if (processingVideos.length === 0) {
        return null;
    }

    // 最新の処理中ファイルを取得
    const latestProcessing = processingVideos[0];

    return (
        <div 
            className="fixed bottom-0 right-4 mb-4 w-[400px] transition-all duration-200 ease-in-out"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                {/* コンパクトビュー */}
                <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            <span className="font-medium">サムネイル生成中</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
                            {completedCount}/{totalCount}
                        </div>
                        {!isExpanded && latestProcessing && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-1 min-w-0">
                                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                                        style={{ width: `${latestProcessing.progress}%` }}
                                    />
                                </div>
                                <span className="text-xs whitespace-nowrap flex-shrink-0">
                                    {latestProcessing.progress}%
                                </span>
                            </div>
                        )}
                    </div>
                    <ChevronUp 
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                            isExpanded ? 'rotate-180' : ''
                        }`}
                    />
                </div>

                {/* 展開ビュー */}
                <div className={`overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'max-h-[200px]' : 'max-h-0'
                }`}>
                    <div className="px-3 pb-3">
                        <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto">
                            {processingVideos.map(video => (
                                <div key={video.id} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                                            {video.filename}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
                                                    style={{ width: `${video.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {video.progress}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessingStatus;