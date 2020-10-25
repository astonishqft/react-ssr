const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(express.static('dist', { index: false }));

// 后端proxy代理
app.use('/api', createProxyMiddleware({
  target: 'https://www.fastmock.site/mock/545c01c52d578bf9ecf5ec775968acda/api/',
  changeOrigin: true,
}));

app.get('/*', async (req, res) => {
  const render = require('./dist/server/index.js').default;
  const html = await render({
    // 当前请求的路径（必选参数）
    pathname: req.url,
  });

  res.send(html.html);
});

app.listen(3000);

console.log('the app is listening at port 3000');
