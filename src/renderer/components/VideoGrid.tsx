import React from 'react'
import { VideoCard } from './VideoCard'
import { VideoFile } from '../../types/store'

interface VideoGridProps {
  videos: VideoFile[];
  onPlayVideo?: (path: string) => void;
  onToggleFavorite?: (path: string) => void;
}

export function VideoGrid({ videos, onPlayVideo, onToggleFavorite }: VideoGridProps) {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDelete={() => { }}
              onRetry={() => { }}
              onUpdated={() => { }}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 