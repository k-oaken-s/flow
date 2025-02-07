import React from 'react';
import { Tag } from '../../types/store';
import { Tags } from 'lucide-react';

interface VideoTagSelectorProps {
    videoId: string;
    selectedTagIds: string[];
    allTags: Tag[];
    onTagsUpdate: (videoId: string, tagIds: string[]) => void;
}

const VideoTagSelector: React.FC<VideoTagSelectorProps> = ({
    videoId,
    selectedTagIds,
    allTags,
    onTagsUpdate
}) => {
    const toggleTag = (e: React.MouseEvent, tagId: string) => {
        e.stopPropagation();
        const newTagIds = selectedTagIds.includes(tagId)
            ? selectedTagIds.filter(id => id !== tagId)
            : [...selectedTagIds, tagId];
        onTagsUpdate(videoId, newTagIds);
    };

    return (
        <div className="flex flex-wrap gap-1 items-center">
            <Tags className="w-4 h-4 text-gray-400" />
            {allTags.map(tag => (
                <button
                    key={tag.id}
                    onClick={(e) => toggleTag(e, tag.id)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        selectedTagIds.includes(tag.id)
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-400 border'
                    }`}
                    style={{
                        backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: tag.color
                    }}
                >
                    {tag.name}
                </button>
            ))}
        </div>
    );
};

export default VideoTagSelector;