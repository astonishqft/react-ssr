const express = require('express');

const app = express();

app.use(express.static('dist', { index: false }));

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
