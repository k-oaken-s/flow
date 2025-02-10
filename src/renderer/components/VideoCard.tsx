import React, { useEffect, useState } from 'react';
import { Tag, VideoFile } from '../../types/store';
import { formatDate } from '../utils/date';
import { Star, StarOff, Tags } from 'lucide-react';
import TagEditModal from './TagEditModel';

interface VideoCardProps {
    video: VideoFile;
    onDelete: (id: string) => void;
    onRetry: (id: string) => void;
    onUpdated: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete, onRetry, onUpdated }) => {
    const [currentThumbnailIndex, setCurrentThumbnailIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(video.processingStatus === 'processing');
    const [currentVideo, setCurrentVideo] = useState(video);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isTagEditModalOpen, setIsTagEditModalOpen] = useState(false);

    const getSelectedTags = () => {
        if (!video.tagIds || !tags) return [];
        return tags.filter(tag => video.tagIds.includes(tag.id));
    };

    // タグ情報を取得
    useEffect(() => {
        const loadTags = async () => {
            try {
                const loadedTags = await window.electronAPI.getTags();
                setTags(loadedTags);
            } catch (error) {
                console.error('Error loading tags:', error);
            }
        };
        loadTags();

        // タグ更新イベントのリスナーを設定
        const unsubscribe = window.electronAPI.onTagsUpdated(loadTags);
        return () => unsubscribe();
    }, []);

    // videos-updatedイベントの監視を追加
    useEffect(() => {
        const unsubscribe = window.electronAPI.onVideosUpdated(async () => {
            if (currentVideo.id) {
                try {
                    const updatedVideo = await window.electronAPI.getVideo(currentVideo.id);
                    if (updatedVideo) {
                        setCurrentVideo(updatedVideo);
                        setIsProcessing(updatedVideo.processingStatus === 'processing');
                    }
                } catch (error) {
                    console.error('Error fetching updated video:', error);
                }
            }
        });

        return () => unsubscribe();
    }, [currentVideo.id]);

    // 動画情報の更新を監視
    useEffect(() => {
        setCurrentVideo(video);
        setIsProcessing(video.processingStatus === 'processing');
    }, [video]);

    // サムネイル生成の進捗を監視
    useEffect(() => {
        if (video.processingStatus === 'processing') {
            const unsubscribe = window.electronAPI.onThumbnailProgress(({ videoId, progress }) => {
                if (videoId === video.id && progress === 100) {
                    setIsProcessing(false);
                }
            });
            return () => unsubscribe();
        }
    }, [video.id, video.processingStatus]);

    const formatDuration = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number): string => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const handleOpenVideo = async () => {
        try {
            await window.electronAPI.openVideo(video.path);
            await window.electronAPI.incrementPlayCount(video.id);
            onUpdated();
        } catch (error) {
            console.error('Error opening video:', error);
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await window.electronAPI.toggleFavorite(video.id);
            onUpdated();
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleTagsUpdate = async (tagIds: string[]) => {
        try {
            await window.electronAPI.updateVideoTags(video.id, tagIds);
            onUpdated();
        } catch (error) {
            console.error('Error updating video tags:', error);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl">
            <div className="p-3">
                {/* 3カラムグリッドレイアウト */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {/* 左カラム: ファイル名とタグ */}
                    <div className="flex flex-col justify-between">
                        <h3 className="font-medium text-gray-800 dark:text-white text-sm truncate hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title={video.filename}>
                            {video.filename}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsTagEditModalOpen(true);
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <Tags className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                            <div className="flex flex-wrap gap-1">
                                {getSelectedTags().map(tag => (
                                    <span
                                        key={tag.id}
                                        className="px-2 py-0.5 text-xs rounded-full text-white shadow-sm transition-transform hover:scale-105"
                                        style={{ backgroundColor: tag.color }}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 中央カラム: メタ情報 */}
                    <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                            <span className="font-medium">{video.metadata?.duration ? formatDuration(video.metadata.duration) : '--:--'}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span>{formatFileSize(video.fileSize)}</span>
                        </div>
                        <div className="flex items-center justify-center">
                            <span className="text-gray-400 dark:text-gray-500">{video.playCount || 0}回再生</span>
                        </div>
                    </div>

                    {/* 右カラム: 日時情報とアクション */}
                    <div className="flex flex-col justify-between items-end text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 dark:text-gray-400">
                                {formatDate(video.added)}
                            </span>
                            <button
                                onClick={handleToggleFavorite}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all hover:scale-105"
                            >
                                {video.isFavorite ? (
                                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                                ) : (
                                    <StarOff className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                            {video.processingStatus !== 'processing' && (
                                <button
                                    onClick={() => onDelete(video.id)}
                                    className="text-red-500 hover:text-red-600 text-xs"
                                >
                                    削除
                                </button>
                            )}
                        </div>
                        {video.lastPlayed && (
                            <span className="text-gray-500 dark:text-gray-400">
                                最終再生: {formatDate(video.lastPlayed)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative">
                {isProcessing ? (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-gray-500">サムネイル生成中...</span>
                    </div>
                ) : currentVideo.thumbnails && currentVideo.thumbnails.length > 0 ? (
                    <div className="grid grid-cols-10 grid-rows-2 gap-0.5">
                        {currentVideo.thumbnails.map((thumbnail, index) => (
                            <div
                                key={index}
                                className="relative aspect-video group"
                            >
                                <img
                                    src={`file://${thumbnail}`}
                                    alt={`${currentVideo.filename} thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onClick={() => setCurrentThumbnailIndex(index)}
                                    onError={(e) => {
                                        console.error('Error loading thumbnail:', {
                                            src: e.currentTarget.src,
                                            index,
                                            videoId: currentVideo.id
                                        });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-gray-500">No thumbnails</span>
                    </div>
                )}

                {/* Processing状態の表示 */}
                {currentVideo.processingStatus === 'processing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/50 rounded">
                        <div className="w-8 h-8 mb-2">
                            <svg className="animate-spin text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                        {currentVideo.processingProgress !== undefined && (
                            <div className="text-white text-sm">
                                {Math.round(currentVideo.processingProgress)}%
                            </div>
                        )}
                    </div>
                )}

                {/* エラー表示 */}
                {currentVideo.processingStatus === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/50 rounded">
                        <span className="text-white mb-2">Error</span>
                        <button
                            onClick={() => onRetry(currentVideo.id)}
                            className="px-3 py-1 bg-white text-red-500 rounded-full text-sm hover:bg-red-50 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>

            <TagEditModal
                isOpen={isTagEditModalOpen}
                onClose={() => setIsTagEditModalOpen(false)}
                selectedTagIds={video.tagIds || []}
                allTags={tags}
                onTagsUpdate={handleTagsUpdate}
            />
        </div>
    );
};

export default VideoCard;