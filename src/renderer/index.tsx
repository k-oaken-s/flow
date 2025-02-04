const ReactDOM = require('react-dom/client');
const App = require('./App').default;

require('./styles/global.css');

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    React.createElement(React.StrictMode, null,
        React.createElement(App)
    )
);