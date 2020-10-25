## 前言

最近这段时间因为工作需要，实践了下 `react` `ssr` 技术，在开发的过程中参考了`飞冰`和 `umi` 的 `SSR` 实现方案，感觉受益匪浅，于是有了这篇文章。

## 是么是ssr（服务端渲染  ）
首先我们要弄清楚什么是 `ssr`(服务端渲染)？

`ssr` 是相对于 `csr` (客户端渲染)而言的，一般我们基于 `vue` 或者 `react` 这类工程进行开发的时候，页面都是客户端渲染出来的，通常的的过程一般是这样的：

在浏览器地址栏输入 `url`，浏览器去服务器请求对应的 `html` 资源，服务器成功返回 `html` 页面，其中包含 `js`、`css`、图片等资源路径，浏览器再去请求对应的 `js`、`css` 等图片资源，资源加载成功后开始执行 `js`，此时如果有 `api` 请求，浏览器会再去发送 `api` 请求，获取页面初始化数据， 完成页面的渲染。

`ssr` 的过程稍微复杂一些，一般的流程是这样的：

在浏览器地址栏输入 `url`，请求发送到服务端，服务端根据请求的 `pathname`，找到对应要渲染的路由组件，调用 `react` 提供的 `renderToString` 或者 `renderToStaticMarkup` 方法，完成将 `React Component` 转换为字符串，最后返回给浏览器进行渲染。浏览器获取 `html` 之后，会再执行一遍 `js` 代码，已执行事件绑定等操作。

## SSR的优势
从上面对 `csr` 和 `ssr` 的过程分析，我们可以看出，`ssr` 的优点很明显。

- 提高首屏的加载速度

服务端返回的字符串已经包含了页面的整个 `Dom` 结构，无需再等待浏览器加载完 `js`，然后通过 `js` 的执行来进行页面渲染。这点尤其针对比较大型的单页应用优势很明显，因为单页应用的打包体积通常比较大，首页加载会出现白屏的现象。

- 更好的SEO

很多搜索引擎目前对单页应用的支持不是很好，因为网页中的很多数据需要通过执行完 `js` 才能获取到，这非常不利于爬虫分析与索引。`ssr` 很好的解决了这一痛点，因为通过 `ssr` 生成的页面是已经包含了完整数据的页面，再结合 `html` 的 `meta` 标签、`title` 和 `description` 等，可以大大提高搜索的排名。

## 如何区分页面是服务端渲染还是客户端渲染的？
当你在访问一个页面的时候，肯定有个疑问，如何判断当前访问的页面是客户端渲染出来的还是服务端渲染出来的呢？

其实判断的方式还是有很多的。比如最简单的，可以选择鼠标放在网页的任意位置，点击鼠标右键，选择**显示网页源代码**，客户端渲染的页面是不会包含页面的具体内容的，如果是react的应用，通常会有一个空的 `div` 容器，比如 `id` 为 `root` 的空 `div`。

![查看网页源代码-客户端渲染效果](https://img-blog.csdnimg.cn/20201008145001907.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2FzdG9uaXNocWZ0,size_16,color_FFFFFF,t_70#pic_center)

如果是服务端渲染，点击鼠标右键，选择**显示网页源代码**，能看到完整的页面内容，还是举上图中的例子，看下服务端渲染的效果。

![查看网页源代码-服务端渲染效果](https://img-blog.csdnimg.cn/20201008144807290.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2FzdG9uaXNocWZ0,size_16,color_FFFFFF,t_70#pic_center)

## 方案构想
为了能尽可能方便的支持 `ssr` 的使用，我想实现的 `ssr` 应当具备以下特性：

1. **与服务端低耦合，无论是 `Nodejs` 还是 `Serverless` 模式，都能很方便的实现部署集成**
2. **支持页面级服务端加载数据**
3. **支持使用 `css-modules` 和 `less`**

客户端和服务端单独编译，服务端编译之后会生成一个 `server.js` 文件，此文件相当于是服务端的入口文件，`nodejs` 中通过引用该文件，执行该文件加载之后的 `render` 方法，根据传入的 `pathname`，生成对应的 `html` 片段，返回给前端。

在 `node` 层使用方式如下：

```js
router.get('/*', async (ctx) => {
  const render = require('dist/server.js');
  const html = render({
    // 当前请求的路径（必选参数）
    pathname: ctx.req.pathname,
    // 可选
    initialData: {},
  });

  ctx.res.body = html;
});
```

## 客户端的实现
为了更好的方便大家理解整个实现的过程，这里我并不使用脚手架来实现 `ssr` 过程。

因为 `ssr` 和 `csr` 的代码是同构的，所以，我们先创建一个 `react` 工程，然后使用 `webpack` 编译客户端代码。

### 初始化工程

新建一个工程，然后执行 `npm init`,新建如下目录:

```
├── public
│   └── index.html
├── src
│   ├── index.js
│   └── pages
├── package.json
└── yarn.lock
```
其中 `src` 目录下的 `index.js` 文件作为入口文件：

*`src/index.js`*

```js
import React, { Component } from 'react'
import ReactDOM from 'react-dom';

class App extends Component {
  render() {
    return (
      <div>Welcome</div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
```
### webpack编译
为了能让浏览器执行 `js` 代码，还需要 `webpack` 来编译上述代码。

在工程根目录下建一个 `webpack.cli.js` 文件，用来编译客户端代码：

*`webpack.cli.js`*
```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const DIST_PATH = path.resolve(__dirname, 'dist');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    filename: '[name].js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.jsx', '.js', '.json'],
    alias: {
      components: path.resolve(__dirname, 'src/components/'),
      pages: path.resolve(__dirname, 'src/pages/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.(eot|woff2?|ttf|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: '[name]-[hash:5].min.[ext]',
              limit: 5000,
              // fonts file size <= 5KB, use 'base64'; else, output svg file
              publicPath: 'fonts/',
              outputPath: 'fonts/',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'webpack-start',
      filename: 'index.html',
      template: './public/index.html',
      inject: true,
      favicon: '',
      minify: false,
      hash: true,
    }),
  ],
  devServer: {
    contentBase: DIST_PATH,
    hot: true,
    historyApiFallback: true,
    compress: false,
    port: 9000,
    open: true,
  },
};
```

安装相关依赖：

```bash
$ yarn add react react-dom
$ yarn add webpack webpack-cli webpack-dev-server style-loader url-loader html-webpack-plugin babel-loader @babel/core @babel/preset-env @babel/preset-react @babel/plugin-proposal-class-properties -D
```

在 `package.json` 的 `scripts` 中增加一行命令：

```json
 "scripts": {
 +  "start": "webpack-dev-server --config  webpack.cli.js"
 }
```

执行 `$ npm  run start`, 打开浏览器输入 `localhost:9000` 就可以看到客户端渲染的效果了。

### 路由
现在我们已经实现了一个 `react` 工程的搭建，当然一个单页应用还缺少一个重要的部分，路由。

执行 `$ yarn add react-router-dom`，安装 `react-router` 相关依赖，新建一个 `renderRoutes.js` 文件，定义一个 `renderRoutes` 方法，该方法可以根据传入的路由配置文件生成路由，并且支持嵌套路由。

*`src/components/renderRoutes.js`*

```js
import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

const renderRoutes = (routersConfig, restProps) => {
  const renderRoute = (config) =>
    config.map((item) => {
      if (item.children && item.children.length) {
        return renderRoute(item.children);
      }
      return (
        <Route exact key={item.path} path={item.path}>
          {item.component}
        </Route>
      );
    });

  return (
    <Switch>
      {renderRoute(routersConfig)}
      <Redirect exact to="/" from="/" />
    </Switch>
  );
}

export default renderRoutes;
```

改造下 `index.js` 文件，引入 `react-router`:

*`src/index.js`*

```js
import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history'
import renderRouters from '@/components/renderRoutes';
import routersConfig from '@/config/routes'

const history = createBrowserHistory();

class App extends Component {
  render() {
    return (
      <Router history={history}>{renderRouters(routersConfig)}</Router>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
```

路由配置文件：
*`config/routes.js`*

```js
import React from 'react';
import Home from 'pages/Home';
import Login from 'pages/Login'

const routersConfig = [
  {
    path: '/',
    name: 'Home',
    component: () => <Home />,
  }, {
    path: '/login',
    name: 'Login',
    component: () => <Login />,
  },
];

export default routersConfig;
```
上面就是一个客户端的实现，这里只是实现了一个最小化的 `react` 应用，包括 `webpack` 编译打包、`es6`语法支持、前端路由的实现等。
## 服务端的实现
上面已经初步介绍过服务端实现的思路，首先是需要一个服务端编译的入口，提供给 `webpack` 进行服务端编译使用。

**在介绍具体的代码实现之前，首先要了解以下几个概念。**

### 同构的概念
同构指的是客户端和服务端共用同一套代码，这也是 `react` 服务端渲染实现的最核心的思想。

### renderToString
`react` 的虚拟 `DOM` 是 `DOM` 在内存中的一种存在形式，这就为 `react` 在服务器环境上运行提供了可能。

`react` 提供了两个用于在服务端渲染组件的方法：`renderToString` 和 `renderToStaticMarkup`。这两个方法的作用都是将虚拟 `DOM` 转换为 `HTML` 字符串进行输出。

经过 `renderToString` 方法渲染过后返回的 `HTML` 片段上会增加两个以 `data-` 为前缀的属性，其中 `data-reactid` 被 `React` 用于区分 `DOM` 节点，当组件的 `props` 或 `state` 发生变化时，`react` 会识别该属性，快速的更新 `DOM`。`data-react-checksum` 是对创建 `DOM` 的校验值，这可以让 `react` 客户端复用与服务端结构相同的代码。

客户端调用 `ReactDOM.hydrate()` 方法，`react` 将会保留该节点且只进行事件处理绑定，从而让你有一个非常高性能的首次加载体验。

### renderToStaticMarkup
`renderToStaticMarkup` 方法和 `renderToString` 方法类似，但此方法不会在 `react` 内部创建以 `data-` 开头的属性。

前面已经说过，`react` 会利用 `data-react-checksum` 属性来检查客户端和服务端渲染的页面结构是否一致。如果检测到 `data-react-checksum` 值不一致，`react` 会舍弃服务端提供的 `DOM` 结构，然后重新渲染组件并将其挂载到页面中，这种情况下将不再拥有服务端渲染带来的性能优势。因此，这里我们选择 `renderToString` 方法。

### StaticRouter
`react-router` 针对服务端渲染的场景专门提供了一个组件 [StaticRouter](https://reactrouter.com/web/guides/server-rendering)，因为服务端的渲染都是无状态的，服务端根据请求的 `url`，传递给 `StaticRouter` 组件，以便能够匹配到路由。

### 代码实现 

在 `src` 目录下创建一个 `server.js` 文件，作为服务端编译的入口文件。

定义一个  `serverRender` 方法，该方法接受一个参数 `pathname`, 当调用 `serverRender` 方法的时候，将 `pathname` 传递给 `StaticRouter` 组件，结合上面封装的 `renderRouters` 方法生成对应的组件，通过 `react-dom/server` 提供的 `renderToString` 方法将组件渲染成字符串，最后嵌入 `html` 片段中返回。

代码如下：

*`src/server.js`*

```js
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { renderToString } from 'react-dom/server';
import renderRouters from '@/components/renderRoutes';
import routersConfig from '@/config/routes';

const serverRender = ({ pathname }) => {
  const RootComponent = () => (
    <StaticRouter location={pathname} static={{}}>
      {renderRouters(routersConfig)}
    </StaticRouter>
  );

  const bundleContent = renderToString(RootComponent());

  console.log('html content:', bundleContent)

  const html = `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#000000" />
        <title>react ssr</title>
      </head>

      <body>
        <div id="root">${bundleContent}</div>
      </body>

    </html>
  `

  return {
    html,
  }
}

export default serverRender;
```

接着配置 `webpack` 配置文件进行服务端打包：

*`webpack.server.js`*

```js
const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/server.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/server'),
    publicPath: '/',
    libraryTarget: 'commonjs2',
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      components: path.resolve(__dirname, 'src/components/'),
      pages: path.resolve(__dirname, 'src/pages/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },
};
```
可以看到，服务端打包的 `webpack` 配置文件和客户端打包的配置文件还是很像的，但是有几个地方需要注意下：

- 配置文件的 `target` 属性设置为 `node`，因为编译后代码的运行环境是在`nodejs`。
- `output` 的 `libraryTarget` 属性需要设置为 `commonjs2`，使打包后的代码兼容 `commonjs` 规范。
- 指定打包的入口为 `entry: './src/server.js'`。

在`package.json` 文件的 `srcipts` 字段中增加一条命令:

```json
 "scripts": {
 +  "build:ssr": "webpack --config webpack.server.js"
 }
```

在工程根目录下新建 `server.js` 文件，内容如下：

```js
const express = require('express');

const app = express();

app.use(express.static('dist', { index: false }));

app.get('/*', async (req, res) => {
  const render = require('./dist/server/index.js').default; // eslint-disable-line
  const html = await render({
    // 当前请求的路径（必选参数）
    pathname: req.url,
  });

  res.send(html.html);
});

app.listen(3000);

console.log('the app is listening at port 3000');
```

先执行：

```bash
$ npm run build:ssr
```
再执行：
```bash
$ node server.js
```
打开浏览器访问 `localhost:3000` 即可看到服务端渲染的效果。

**进一步思考：**

这么做会存在一个问题，现在我们确实可以根据请求的 `url` 来返回相应的 `html` ，但是返回的 `html` 中并没有 `js` 和 `css` 资源。

前面我们介绍过，`react` 在服务端渲染时需要在客户端也执行一遍 `js` 代码，以执行绑定事件等操作。因此这里我们想到利用客户端编译之后的 `html` 文件。

 `webpack` 在进行客户端编译时，借助于 `html-webpack-plugin` 插件，能够将打包后的 `js`、`css` 资源地址直接嵌入 `html` 文件中输出，类似于下面这样：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSR</title>
</head>
<body>
  <div id="root"></div>
  <script src="main.js?44c0eed6a8d4ddce3c64"></script></body>
</html>
```

其中会包含客户端打包后的 `js` 和 `css` 等资源地址。

所以接下来我们改造的思路就是利用客户端编译后生成的 `html` 文件作为我们服务端编译的输出 `html` 模板。

为了方便使用 `nodejs` 来操作 `DOM`，我选择了 [cheerio](https://www.npmjs.com/package/cheerio) 这个包，其 `api` 和 `jquery` 类似。现在改造一下 `server.js`:

```js
const serverRender = ({ pathname }) => {
  const RootComponent = () => (
    <StaticRouter location={pathname} static={{}}>
      {renderRouters(routersConfig)}
    </StaticRouter>
  );
  const bundleContent = renderToString(RootComponent());
  const $ = cheerio.load('__SERVER_HTML_TEMPLATE__');
  $('#root').append(bundleContent)
  const html = $.html();
  return {
    html,
  }
}
```
这里可以看到，我使用了一个变量 `__SERVER_HTML_TEMPLATE__` 来进行占位，执行服务端编译之后 `server.js` 代码是这样的（以下截取了服务端编译后的部分 `server.js` 代码片段）。

![server.js代码片段](https://img-blog.csdnimg.cn/20201008231435290.png#pic_center)

因此在执行完服务端的编译之后，我们需要写一个 `webpack` 插件，使用客户端编译后生成的 `html` 字符串来替换  `__SERVER_HTML_TEMPLATE__`  这个全局变量。

*`replaceHtmlTemplateWebpackPlugin`*

```js
const minify = require('html-minifier').minify
const path = require('path');
const fs = require('fs');

class SSRCompileDonePlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('SSRCompileDone', (stats) => {
      const htmlFilePath = path.join(__dirname, 'dist', 'index.html');
      const ssrBuildFile = path.join(__dirname, 'dist', 'server', 'index.js');
      const bundle = fs.readFileSync(ssrBuildFile, 'utf-8');
      const html = fs.readFileSync(htmlFilePath, 'utf-8');
      const minifedHtml = minify(html, { collapseWhitespace: true, quoteCharacter: '\'' });
      const newBundle = bundle.replace(/__SERVER_HTML_TEMPLATE__/, minifedHtml);
      fs.writeFileSync(ssrBuildFile, newBundle, 'utf-8');
    });
  }
}

module.exports = SSRCompileDonePlugin;
```
写这个插件需要注意的是，必须要等到服务端编译的文件输出后才能执行字符串的替换工作，因此这里选择在 `compiler.hooks.afterEmit` 这个 `hooks` 里进行字符串替换操作。

在 `webpack.server.js` 配置文件中引入这个插件后，重新执行服务端编译，服务端编译输出的产物中的 `__SERVER_HTML_TEMPLATE__` 字符串已经被替换为 客户端编译输出的 `html` 模板，这样就能够满足我们的基本需求了。

![经过插件之后ssr编译后的输出](https://img-blog.csdnimg.cn/20201008231705318.png#pic_center)

OK，现在，我们的 `SSR` 框架已经算完成了一半了，我们先运行 `$ npm run build` 执行客户端编译，再执行 `npm run build:ssr` 进行服务端编译，最后执行 `node server.js` 就可以看到 `SSR` 的基本效果了。可以看到，客户端编译后的 `js` 资源也顺利引用到了，很完美！

需要注意的是，在执行服务端编译之前一定要先进行一遍客户端编译，这里的目的主要有两个：

- 服务端编译时需要依赖客户端编译输出的模板 `html` 文件，关于这点上面已经详细介绍过了
- `SSR` 的时候也会执行一遍 `js` 代码，因此需要利用客户端打包之后输出的 `js` 资源，同时 `js` 代码执行之后还会去加载图片、字体文件、样式等资源，这些都是需要依赖客户端编译的输出产物

![在这里插入图片描述](https://img-blog.csdnimg.cn/2020100823261720.png#pic_center)
### 样式问题
到目前为止，我们的 `SSR` 已经具备了基本的功能，能够直出 `html` 片段了，但是还有个棘手的问题等待我们解决，那就是样式问题。

在客户端编译时，一般使用 `css-loader` + `style-loader` 来处理样式，`css-loader` 负责解析 `css` 类型的文件，`style-loader` 负责将样式通过 `style` 标签的形式嵌入到 `html` 中。

对于服务端渲染，这么做就不行了，如果服务端使用上述方式进行编译，会提示 `
ReferenceError: window is not defined` 报错，很显然，在服务端渲染时根本就不存在 `window` 对象。

查找了很多资料，处理服务端渲染样式用的比较多的是 [isomorphic-style-loader](https://www.npmjs.com/search?q=isomorphic-style-loader) 这个库。这个库的用法和 `style-loader` 类似，但是发现使用起来还是挺繁琐的，那么有没有什么更好的方式处理服务端渲染时的样式呢？

答案是肯定的。

查看 `css-loader` 的文档，我们发现css-loader提供了一个参数 [onlyLocals](https://github.com/webpack-contrib/css-loader/tree/v3.6.0#onlylocals)  **（注意，这是css-loader 3.x版本中提供的属性，在最新的4.x版本中已经改为了exportOnlyLocals）**，文档里是这么介绍的：

> Useful when you use css modules for pre-rendering (for example SSR). For pre-rendering with mini-css-extract-plugin you should use this option instead of style-loader!css-loader in the pre-rendering bundle. It doesn't embed CSS but only exports the identifier mappings.

简单翻译下：这个属性就是为预渲染提供的（比如`SSR`），配合 `mini-css-extract-plugin` 插件一起使用，它不嵌入`CSS`，只导出标识符映射。

我们的服务端渲染的样式方案就依赖次选项。

客户端渲染时还是使用 `css-loader` 进行打包，配合 `mini-css-extract-plugin` 插件将 `css` 样式从 `js` 文件中提取到单独的 `css` 文件中，输出到 `dist` 目录中。服务端打包时只需要使用如下配置：

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/i,
        loader: 'css-loader',
        options: {
          onlyLocals: true,
        },
      },
    ],
  },
};
```

此配置会将 `className` 打包嵌入到 `html` 中去，前面已经说过，我们服务端返回的 `html` 字符串中已经包含了客户端打包后的`css`资源路径，这样，服务端返回 `html` 后，有了样式的 `className`，通过网路请求获取到客户端打包后的样式文件，样式也就能生效了。

现在我们顺着这个思路，先改造下客户端的 `webpack` 配置文件，为了做到更好的样式隔离，这里我选择了开启 `css-module`，并且支持 `less` 的使用。

安装相关依赖：

```bash
yarn add css-loader@3.6.0 mini-css-extract-plugin@0.9.0 postcss@7.0.32 postcss-loader@3.0.0 postcss-preset-env@6.7.0 postcss-flexbugs-fixes@4.2.1 less@3.11.3 less-loader@5.0.0
```
看下客户端编译样式处理的 `webpack` 配置(完整的 `webpack` 配置文件可以参考源码)：

**`webpack.cli.prod.js`**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.less/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]-[local]--[hash:base64:5]',
              },
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                require('postcss-flexbugs-fixes'),
                require('postcss-preset-env')({
                  autoprefixer: {
                    flexbox: 'no-2009',
                  },
                  stage: 3,
                }),
              ],
            }
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
    
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
  ],
};
```

看下服务端编译样式处理的 `webpack` 配置(完整的 `webpack` 配置文件可以参考源码)：

**`webpack.server.js`**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.less/,
        use: [
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]-[local]--[hash:base64:5]',
              },
              onlyLocals: true,
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                require('postcss-flexbugs-fixes'),
                require('postcss-preset-env')({
                  autoprefixer: {
                    flexbox: 'no-2009',
                  },
                  stage: 3,
                }),
              ],
            }
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
    ],
  },
};
```

使用：

**`Home/index.js`**
```js
import React from 'react';
import styles from './index.less';

export default () => {
  return (
    <div className={styles.container}>
      <h2>Home page</h2>
    </div>
  );
}
```

**`Home/index.less`**

```css
.container {
  background: red;
}
```

`webpack` 配置文件配置成功后，我们重新编译一下客户端和服务端，启动 `nodejs` 服务后可以看到，我们想要的 `SSR` 时直出的 `html` 片段中已经包含了对应的 `className` 标识，同时加载到了客户端编译的 `css` 资源，于是服务端渲染时的样式问题到这里就完美解决了！

![在这里插入图片描述](https://img-blog.csdnimg.cn/20201011220024545.png#pic_center)

### 数据同构
服务端渲染另外一个不得不考虑的问题就是如何使用同一套代码去请求数据。

服务器直出 `html` 时，需要在服务端就完成数据的请求，并将数据携带回，等到浏览器接管页面的时候，需要能够判如果这个数据已经有了，就无需再去请求后台服务了。

`react `中，在客户端渲染时一般数据请求都会推荐放在 `componentDidMount` 生命周期里面去做，但是服务端渲染时不会走这个生命周期，我们就考虑通过给需要请求数据的路由组件定义一个静态方法 `getInitialProps`，不管是客户端渲染还是服务端都通过这个静态方法来获取数据。

类似于下面这样:

**`Home/index.js`**
```js
import React from 'react';
import axios from 'axios';
import styles from './index.less';

class Home extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <h2>Home page</h2>
      </div>
    );
  }
}

Home.getInitialProps = async () => {
  const entry = 'http:localhost:3000/api/list'
  const { list = [] } = await axios(entry);

  return {
    home: {
      list,
    },
  };
};

export default Home;
```
首先，在服务端需要根据前端传入的 `pathname` 来找到当前的 `React` 组件，然后调用该组件上定义的静态方法。

封装一个方法 `getComponentByPath`:

```js
function getComponentByPath(routes, currPath) {
  function findMatchRoute(routeList) {
    const matchedRoute = routeList.find(route => {
      return matchPath(currPath, route)
    })
    if (matchedRoute) {
      return matchedRoute.children
        ? findMatchRoute(matchedRoute.children)
        : matchedRoute
    }
    return null
  }
  const matchedRoute = findMatchRoute(routes)
  return matchedRoute && matchedRoute.component
}
```

改造一下 `server.js` 文件中的 `serverRender` 方法。

为了更加方便的操作异步数据，我们将 `serverRender` 函数改为 `async` 函数，需要修改一下babel配置，支持 `async` 语法。














https://juejin.im/post/6844903694870265870#heading-1










服务端会首先根据传入的pathname去前端路由文件查找对应要渲染的组件。

```js
import { matchPath } from 'react-router-dom'

function getComponentByPath(routes, currPath) {
  function findMatchRoute(routeList) {
    const matchedRoute = routeList.find(route => {
      return matchPath(currPath, route)
    })
    if (matchedRoute) {
      return matchedRoute.children
        ? findMatchRoute(matchedRoute.children)
        : matchedRoute
    }
    return null
  }
  const matchedRoute = findMatchRoute(routes)
  return matchedRoute && matchedRoute.component
}
```








