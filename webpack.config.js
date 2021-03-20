var path = require('path')

module.exports = {
    mode: "production",

    devtool: "none",

    resolve: {
        "extensions": [".ts", ".tsx", ".js", ".jsx"]
    },

    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            { 
                test: /\.jsx$/, 
                loader: 'jsx-loader?harmony'
            }
        ],
    },

    output: {
        path: path.resolve(__dirname, './static/js')
    },

    externals: [
        ///^\@material-ui\/(core|icons)[\/a-zA-Z]*/,
        {
            "@material-ui/core": "MaterialUI",
            "react": "React",
            "react-dom": "ReactDOM",
            "gl-matrix": "glMatrix",
        }
    ]
}


function externalForMUI(context, request, callback) {
    if (/@material-ui.+/.test(request)) {
        const name = request.replace(/^.*[\\\/]/, '')
        return callback(null, 'root MaterialUI.' + name);
    }
    callback();
}