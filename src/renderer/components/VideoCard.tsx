import React, { useState } from 'react';
import { VideoFile } from '../../types/store';

interface VideoCardProps {
    video: VideoFile;
    onDelete: (id: string) => void;
    onRetry: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete, onRetry }) => {
    const [currentThumbnail, setCurrentThumbnail] = useState(0);

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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* サムネイル表示エリア */}
            <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                {video.thumbnails && video.thumbnails.length > 0 ? (
                    <>
                        <img
                            src={`file://${video.thumbnails[currentThumbnail]}`}
                            alt={video.filename}
                            className="w-full h-full object-cover"
                        />
                        {/* タイムラインバー */}
                        {video.thumbnails.map((_: string, index: number) => (
                            <div
                                key={index}
                                className={`flex-1 h-full cursor-pointer hover:bg-blue-500/50 ${currentThumbnail === index ? 'bg-blue-500' : ''
                                    }`}
                                onMouseEnter={() => setCurrentThumbnail(index)}
                            />
                        ))}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-500">No thumbnail</span>
                    </div>
                )}
                {video.processingStatus === 'processing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/50">
                        <div className="w-8 h-8 mb-2">
                            <svg className="animate-spin text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                        {video.processingProgress !== undefined && (
                            <div className="text-white text-sm">
                                {Math.round(video.processingProgress)}%
                            </div>
                        )}
                    </div>
                )}
                {video.processingStatus === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/50">
                        <span className="text-white mb-2">Error</span>
                        <button
                            onClick={() => onRetry(video.id)}
                            className="px-3 py-1 bg-white text-red-500 rounded-full text-sm hover:bg-red-50 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>

            {/* 情報表示エリア */}
            <div className="p-4">
                <h3 className="font-medium text-gray-800 dark:text-white truncate" title={video.filename}>
                    {video.filename}
                </h3>
                <div className="mt-1 flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{video.metadata?.duration ? formatDuration(video.metadata.duration) : '--:--'}</span>
                    <span>{formatFileSize(video.fileSize)}</span>
                </div>
            </div>

            {/* コントロールエリア */}
            <div className="px-4 pb-4 flex justify-end space-x-2">
                {video.processingStatus !== 'processing' && (
                    <button
                        onClick={() => onDelete(video.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoCard;