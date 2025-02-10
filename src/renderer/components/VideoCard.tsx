import React, { useEffect, useState } from 'react';
import { Tag, VideoFile } from '../../types/store';
import { formatDate } from '../utils/date';
import { Star, StarOff, Tags, Play, Trash2 } from 'lucide-react';
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
    const [isFavorite, setIsFavorite] = useState(video.isFavorite);
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

    // コンポーネントの先頭付近でuseEffectを追加
    useEffect(() => {
        console.log('Current Video Metadata:', currentVideo.metadata);
    }, [currentVideo.metadata]);

    const formatDuration = (seconds: number): string => {
        if (!seconds) return '--:--';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            setIsFavorite(!isFavorite);
            await window.electronAPI.toggleFavorite(video.id);
        } catch (error) {
            setIsFavorite(isFavorite);
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700">
            {/* メタデータエリア */}
            <div className="p-5">
                {/* ヘッダー: ファイル名と操作ボタン */}
                <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-1 pr-4"
                        title={video.filename}>
                        {video.filename}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                            onClick={handleToggleFavorite}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all hover:scale-105"
                            title={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
                        >
                            {isFavorite ? (
                                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                            ) : (
                                <StarOff className="w-4 h-4 text-gray-400 hover:text-yellow-400" />
                            )}
                        </button>
                        {video.processingStatus !== 'processing' && (
                            <button
                                onClick={() => onDelete(video.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                title="削除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* メタ情報とタグ */}
                <div className="flex items-center justify-between">
                    {/* 左側: メタ情報 */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            <span className="font-medium">
                                {(() => {
                                    console.log('Duration:', currentVideo.metadata?.duration);
                                    return currentVideo.metadata?.duration
                                        ? formatDuration(currentVideo.metadata.duration)
                                        : '--:--';
                                })()}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>{formatFileSize(currentVideo.fileSize)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <span>{currentVideo.playCount || 0}回再生</span>
                        </div>
                    </div>

                    {/* 右側: タグ管理 */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsTagEditModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            title="タグを編集"
                        >
                            <Tags className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                        <div className="flex flex-wrap gap-1.5">
                            {getSelectedTags().map(tag => (
                                <span
                                    key={tag.id}
                                    className="px-2 py-0.5 text-xs rounded-full text-white shadow-sm transition-all hover:scale-105 hover:shadow"
                                    style={{ backgroundColor: tag.color }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 日時情報 */}
                <div className="mt-3 flex items-center justify-end gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span>追加: {formatDate(video.added)}</span>
                    {video.lastPlayed && (
                        <>
                            <span>•</span>
                            <span>最終再生: {formatDate(video.lastPlayed)}</span>
                        </>
                    )}
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