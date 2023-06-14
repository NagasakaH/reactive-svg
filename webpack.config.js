const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'reactiveSvg',
    libraryTarget: 'umd',
    globalObject: "typeof self !== 'undefined' ? self : this",
  },
  resolve: {
    extensions: ['.ts', '.js', '.css'],
  },
  module: {
    rules: [
      {test: /\.ts$/, loader: 'ts-loader', exclude: /node_modules/},
      {
        test: /\.css/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {from: 'build/index.d.ts', to: './'},
        {from: 'build/index.js.map', to: './'},
      ],
    }),
  ],
};
