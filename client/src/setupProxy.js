const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    // We want to redirect /render request directly to the backend so it can return rendered html
    app.use(
        '/render',
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
        })
    );
};