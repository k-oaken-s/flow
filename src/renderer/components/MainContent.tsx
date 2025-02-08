import React, { useEffect, useState } from 'react';
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

    // 動画一覧の取得
    const loadVideos = async () => {
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
    };

    // フィルター適用関数
    const applyFilters = (videoList: VideoFile[], filters: FilterState) => {
        let result = [...videoList];

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

        // お気に入りフィルター
        if (filters.isFavoriteOnly) {
            result = result.filter(video => video.isFavorite);
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
    };

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

    // フィルター変更の購読
    useEffect(() => {
        const unsubscribe = window.electronAPI.onFilterChanged((newFilter) => {
            setFilterState(newFilter);
            applyFilters(videos, newFilter);
        });

        return () => unsubscribe();
    }, [videos]);

    // 初期読み込み
    useEffect(() => {
        loadVideos();
    }, [refreshTrigger]);

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
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p className="mb-4">動画が見つかりません</p>
                        <div className="flex gap-4">
                            <button
                                onClick={handleFileSelect}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                動画を追加
                            </button>
                            <button
                                onClick={handleFolderSelect}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                フォルダを追加
                            </button>
                        </div>
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