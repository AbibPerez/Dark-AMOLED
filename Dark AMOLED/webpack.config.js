const { exec } = require("child_process");
const path = require("path");

module.exports = (env, options) => {
  const { mode = "development" } = options;
  const rules = [
    {
      test: /\.m?js$/,
      use: [
        "html-tag-js/jsx/tag-loader.js",
        {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      ],
    },
    {
      test: /\.(sa|sc|c)ss$/,
      use: ["raw-loader", "postcss-loader", "sass-loader"],
    },
  ];

  const main = {
    mode,
    entry: {
      main: "./src/main.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      chunkFilename: "[name].js",
    },
    module: {
      rules,
    },
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.afterDone.tap("pack-zip", (stats) => {
            if (stats.hasErrors()) {
              return;
            }
            exec("node ./pack-zip.js", (err, stdout, stderr) => {
              if (err) {
                console.error(err);
                return;
              }
              if (stderr) {
                console.error(stderr);
              }
              console.log(stdout);
            });
          });
        },
      },
    ],
  };

  return [main];
};
