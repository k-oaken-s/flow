// components/TagManagerModal.tsx
import React, { useState } from 'react';
import { Tag } from 'src/types/store';
import { X } from 'lucide-react';

interface TagManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tags: Tag[];
    onAddTag: (name: string, color: string) => void;
    onRemoveTag: (id: string) => void;
}

const TagManagerModal: React.FC<TagManagerModalProps> = ({
    isOpen,
    onClose,
    tags,
    onAddTag,
    onRemoveTag
}) => {
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3B82F6');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTagName.trim()) {
            onAddTag(newTagName.trim(), newTagColor);
            setNewTagName('');
            setNewTagColor('#3B82F6');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">タグ管理</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 新規タグ追加フォーム */}
                <form onSubmit={handleSubmit} className="mb-6">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="新しいタグ名"
                            className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                        <input
                            type="color"
                            value={newTagColor}
                            onChange={(e) => setNewTagColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            追加
                        </button>
                    </div>
                </form>

                {/* タグリスト */}
                <div className="space-y-2">
                    {tags.map(tag => (
                        <div
                            key={tag.id}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                />
                                <span>{tag.name}</span>
                            </div>
                            <button
                                onClick={() => onRemoveTag(tag.id)}
                                className="text-red-500 hover:text-red-600"
                            >
                                削除
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TagManagerModal;