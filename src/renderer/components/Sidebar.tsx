import React from 'react';

const Sidebar: React.FC = () => {
    return (
        <div className="w-64 h-screen bg-gray-800 text-white p-4">
            <div className="text-xl font-bold mb-6">Flow</div>
            <nav>
                <ul className="space-y-2">
                    <li className="px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
                        すべての動画
                    </li>
                    <li className="px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
                        最近追加
                    </li>
                    <li className="px-2 py-1 hover:bg-gray-700 rounded cursor-pointer">
                        お気に入り
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;