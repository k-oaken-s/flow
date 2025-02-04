import React from 'react'

const App: React.FC = () => {
    return (
        <div style={{
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        }}>
            <h1 style={{
                fontSize: '24px',
                marginBottom: '16px',
            }}>Flow</h1>
            <p style={{
                fontSize: '16px',
                color: '#666',
            }}>Video Management Application</p>

            {/* 開発用の情報表示 */}
            <div style={{
                marginTop: '20px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
            }}>
                <p>Development Mode</p>
                <p>Node.js version: {process.versions.node}</p>
                <p>Electron version: {process.versions.electron}</p>
                <p>Chrome version: {process.versions.chrome}</p>
            </div>
        </div>
    )
}

export default App