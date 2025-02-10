// components/TagManagerModal.tsx
import React, { useState, useEffect } from 'react';
import { Tag } from 'src/types/store';
import { X } from 'lucide-react';

interface TagManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    tags: Tag[];
    onAddTag: (name: string) => void;
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

    const handleAddTag = () => {
        if (newTagName.trim()) {
            onAddTag(newTagName.trim());
            setNewTagName('');
        }
    };

    // ESCキーでモーダルを閉じる
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">タグ管理</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="p-4 space-y-4">
                    {/* タグ追加フォーム */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="新しいタグ名"
                            className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTag();
                            }}
                        />
                        <button
                            onClick={handleAddTag}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            追加
                        </button>
                    </div>

                    {/* タグリスト */}
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {tags.map(tag => (
                            <div key={tag.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-gray-900 dark:text-gray-100">{tag.name}</span>
                                <button
                                    onClick={() => onRemoveTag(tag.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TagManagerModal;