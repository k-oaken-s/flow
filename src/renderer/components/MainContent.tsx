import React, { useEffect, useState, useCallback } from 'react';
import VideoCard from './VideoCard';
import { Tag, VideoFile } from '../../types/store';
import { FilterState } from 'src/types/filter';

const MainContent: React.FC = () => {
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [filteredVideos, setFilteredVideos] = useState<VideoFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterState, setFilterState] = useState<FilterState>({
        searchQuery: '',
        selectedTagIds: [],
        isFavoriteOnly: false,
        sortBy: 'added',
        sortOrder: 'desc'
    });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // applyFiltersをuseCallbackでメモ化
    const applyFilters = useCallback((videoList: VideoFile[], filters: FilterState) => {
        let result = [...videoList];

        // お気に入りフィルター
        if (filters.isFavoriteOnly) {
            result = result.filter(video => video.isFavorite);
        }

        // 検索フィルター
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            result = result.filter(video =>
                video.filename.toLowerCase().includes(query)
            );
        }

        // タグフィルター
        if (filters.selectedTagIds.length > 0) {
            result = result.filter(video =>
                filters.selectedTagIds.every(tagId =>
                    video.tagIds?.includes(tagId)
                )
            );
        }

        // ソート
        result.sort((a, b) => {
            let comparison = 0;
            switch (filters.sortBy) {
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
            return filters.sortOrder === 'asc' ? -comparison : comparison;
        });

        setFilteredVideos(result);
    }, []);

    // loadVideosをuseCallbackで最適化
    const loadVideos = useCallback(async () => {
        try {
            setIsLoading(true);
            const videoList = await window.electronAPI.getVideos();
            setVideos(videoList);
            applyFilters(videoList, filterState);
        } catch (error) {
            console.error('Error loading videos:', error);
            setVideos([]);
            setFilteredVideos([]);
        } finally {
            setIsLoading(false);
        }
    }, [filterState, applyFilters]);

    // 動画一覧の更新を監視
    useEffect(() => {
        const unsubscribe = window.electronAPI.onVideosUpdated(() => {
            loadVideos();
        });

        return () => unsubscribe();
    }, [loadVideos]);

    // フィルター変更の購読
    useEffect(() => {
        const unsubscribe = window.electronAPI.onFilterChanged((newFilter) => {
            setFilterState(newFilter);
            applyFilters(videos, newFilter);
        });

        return () => unsubscribe();
    }, [videos, applyFilters]);

    // 初期読み込み
    useEffect(() => {
        loadVideos();
    }, [loadVideos, refreshTrigger]);

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

    const handleFolderSelect = async () => {
        await window.electronAPI.selectFolder();
        setRefreshTrigger(prev => prev + 1);
    };

    const handleFileSelect = async () => {
        await window.electronAPI.selectFiles();
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex flex-col flex-1 h-screen bg-gray-50 dark:bg-gray-900">
            <div className="flex-1 p-6 overflow-auto">
                {videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] space-y-4">
                        <p className="text-gray-500 dark:text-gray-400">
                            動画ファイルが追加されていません
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => window.electronAPI.selectFiles()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                ファイルを追加
                            </button>
                            <button
                                onClick={() => window.electronAPI.selectFolder()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                フォルダを追加
                            </button>
                        </div>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
                        <p className="text-gray-500 dark:text-gray-400">
                            条件に一致する動画が見つかりませんでした
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-y-4">
                        {filteredVideos.map((video) => (
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