import path from "path"
import GenerateJsonPlugin from "generate-json-webpack-plugin"
import CopyWebpackPlugin from "copy-webpack-plugin"
import webpack from "webpack"
// Generate json files 
import manifest from "../src/manifest"
import i18nChrome from "../src/i18n/chrome"
import tsConfig from '../tsconfig.json'
import MiniCssExtractPlugin from "mini-css-extract-plugin"
const tsPathAlias = tsConfig.compilerOptions.paths

const generateJsonPlugins = [
    new GenerateJsonPlugin('manifest.json', manifest) as unknown as webpack.WebpackPluginInstance
]

const localeJsonFiles = Object.entries(i18nChrome)
    .map(([locale, message]) => new GenerateJsonPlugin(`_locales/${locale}/messages.json`, message))
    .map(plugin => plugin as unknown as webpack.WebpackPluginInstance)
generateJsonPlugins.push(...localeJsonFiles)

// Process the alias of typescript modules
const resolveAlias: { [index: string]: string | false | string[] } = {}
const aliasPattern = /^(@.*)\/\*$/
const sourcePattern = /^(src(\/.*)?)\/\*$/
Object.entries(tsPathAlias).forEach(([alias, sourceArr]) => {
    // Only process the alias starts with '@'
    if (!aliasPattern.test(alias)) {
        return
    }
    if (!sourceArr.length) {
        return
    }
    const index = alias.match(aliasPattern)[1]
    const webpackSourceArr = sourceArr
        .filter(source => sourcePattern.test(source))
        // Only set alias which is in /src folder
        .map(source => source.match(sourcePattern)[1])
        .map(folder => path.resolve(__dirname, '..', folder))
    resolveAlias[index] = webpackSourceArr
})
console.log("Alias of typescript: ")
console.log(resolveAlias)

const staticOptions: webpack.Configuration = {
    entry: {
        background: './src/background',
        content_scripts: './src/content-script',
        // The entrance of popup page
        popup: './src/popup',
        // The entrance of app page
        app: './src/app',
        // The entrance of guide page
        guide: './src/guide',
    },
    output: {
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /^(node_modules|test|script)/,
                use: ['ts-loader']
            }, {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            }, {
                test: /\.sc|ass$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
            }, {
                test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
                exclude: /node_modules/,
                use: ['url-loader']
            }, {
                test: /\.m?js$/,
                exclude: /(node_modules)/,
                use: ['babel-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.ts', ".js", '.css', '.scss', '.sass'],
        alias: resolveAlias,
        fallback: {
            // fallbacks of axios's dependencies start
            stream: require.resolve('stream-browserify'),
            zlib: false,
            https: false,
            http: false,
            url: false,
            assert: false,
            // fallbacks of axios's dependencies end
        }
    }
}

const optionGenerator = (outputPath: string, manifestHooker?: (manifest: chrome.runtime.ManifestV3) => void) => {
    manifestHooker?.(manifest)
    const plugins = [
        ...generateJsonPlugins,
        // copy static resources
        new CopyWebpackPlugin({
            patterns: [
                { from: path.join(__dirname, '..', 'public'), to: path.join(outputPath, 'static') }
            ]
        }),
        new MiniCssExtractPlugin(),
    ]
    return {
        ...staticOptions,
        plugins
    } as webpack.Configuration
}

export default optionGenerator