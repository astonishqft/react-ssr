const path = require('path');
const ReplaceHtmlTemplateWebpackPlugin = require('./replaceHtmlTemplateWebpackPlugin');

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
        test: [/\.css/],
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
          }
        ],
      },
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
  plugins: [
    new ReplaceHtmlTemplateWebpackPlugin(),
  ],
};
