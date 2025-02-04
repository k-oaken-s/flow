import React from 'react';

const Header: React.FC = () => {
    return (
        <div className="h-16 bg-white border-b flex items-center justify-between px-6">
            <div className="flex items-center">
                <input
                    type="text"
                    placeholder="検索..."
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    動画を追加
                </button>
            </div>
        </div>
    );
};

export default Header;