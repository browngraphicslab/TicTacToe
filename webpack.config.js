const { resolve } = require("path");
const Copy = require('copy-webpack-plugin');
const public = resolve(__dirname, "static");

module.exports = {
    mode: 'production',
    entry: {
        solution_bundle: "./src/client/solution_index.tsx",
        stencil_bundle: "./src/client/stencil_index.tsx",
        smart_bundle: "./src/client/smart_index.tsx"
    },
    devtool: "source-map",
    output: {
        filename: "[name].js",
        path: `${public}/bundles`,
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx']
    },
    node: {
        console: true,
        fs: 'empty',
        net: 'empty',
        tls: 'empty'
    },
    plugins: [
        new Copy([
            { from: resolve(__dirname, "src/assets") , to: public }
        ])
    ],
    module: {
        rules: [
            {
                test: [/\.tsx?$/],
                use: [
                    { loader: 'ts-loader', options: { transpileOnly: true } }
                ]
            },
            {
                test: /\.scss|css$/,
                use: [
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            },
            {
                test: /\.(jpg|png|pdf)$/,
                use: [
                    {
                        loader: 'file-loader'
                    }
                ]
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            }
        ]
    }
};