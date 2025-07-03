import { createProxyMiddleware } from "http-proxy-middleware";

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const proxy = createProxyMiddleware({
  target: "https://api.github.com",
  changeOrigin: true,
  headers: {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
  },
  pathRewrite: {
    "^/api/github": "",
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.removeHeader("x-forwarded-for");
    proxyReq.removeHeader("x-forwarded-host");
    proxyReq.removeHeader("x-forwarded-proto");
  },
});

export default proxy;
