const path = require('path');
module.exports = {
  mode: 'development',
  entry: './src/reactiveSVG.ts',
  output: {
    filename: 'reactiveSVG.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'reactiveSvg',
    libraryTarget: 'umd',
    globalObject: "typeof self !== 'undefined' ? self : this",
  },
  devtool: 'source-map',
  optimization: {
    minimize: true,
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
};
