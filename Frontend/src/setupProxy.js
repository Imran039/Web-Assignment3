const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      secure: false,
      onProxyRes: function (proxyRes, req, res) {
        // Remove CORS headers that might be set to *
        proxyRes.headers["Access-Control-Allow-Origin"] =
          "http://localhost:3000";
        proxyRes.headers["Access-Control-Allow-Credentials"] = "true";
        proxyRes.headers["Access-Control-Allow-Methods"] =
          "GET, POST, PUT, DELETE, OPTIONS";
        proxyRes.headers["Access-Control-Allow-Headers"] =
          "Content-Type, Authorization";
      },
    })
  );
};
