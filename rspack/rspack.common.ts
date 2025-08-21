import {
    CopyRspackPlugin, CssExtractRspackPlugin, DefinePlugin, HtmlRspackPlugin,
    type Chunk, type Configuration,
    type RspackPluginInstance,
    type RuleSetRule
} from "@rspack/core"
import path, { join } from "path"
import postcssRTLCSS from 'postcss-rtlcss'
import i18nChrome from "../src/i18n/chrome"
import { GenerateJsonPlugin } from "./plugins/generate-json"

export const MANIFEST_JSON_NAME = "manifest.json"

const generateJsonPlugins: RspackPluginInstance[] = []

const localeJsonFiles = Object.entries(i18nChrome)
    .map(([locale, message]) => new GenerateJsonPlugin(`_locales/${locale}/messages.json`, message))
    .map(plugin => plugin as unknown as RspackPluginInstance)
generateJsonPlugins.push(...localeJsonFiles)

type EntryConfig = {
    name: string
    path: string
}

const BACKGROUND = 'background'
const CONTENT_SCRIPT = 'content_scripts'
const CONTENT_SCRIPT_SKELETON = 'content_scripts_skeleton'
const POPUP = 'popup'

const entryConfigs: EntryConfig[] = [{
    name: BACKGROUND,
    path: './src/background',
}, {
    name: CONTENT_SCRIPT,
    path: './src/content-script',
}, {
    name: CONTENT_SCRIPT_SKELETON,
    path: './src/content-script/skeleton',
}, {
    name: POPUP,
    path: './src/pages/popup',
}, {
    name: 'popup_skeleton',
    path: './src/pages/popup/skeleton',
}, {
    name: 'app',
    path: './src/pages/app',
}, {
    name: 'side',
    path: './src/pages/side'
}]

const POSTCSS_LOADER_CONF: RuleSetRule['use'] = {
    loader: 'postcss-loader',
    options: {
        postcssOptions: {
            plugins: [postcssRTLCSS({ mode: 'combined' })],
        },
    },
}

const chunkFilter = ({ name }: Chunk) => {
    return !name || ![BACKGROUND, CONTENT_SCRIPT, CONTENT_SCRIPT_SKELETON].includes(name)
}

const staticOptions: Configuration = {
    entry() {
        const entry: Record<string, string> = {}
        entryConfigs.forEach(({ name, path }) => entry[name] = path)
        return entry
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /^(node_modules|test|script)/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        assumptions: {
                            // Fix that react transform array proxy to object, and error occurs while destructing
                            iterableIsArray: true,
                        },
                        presets: ["@babel/preset-env"],
                        plugins: [
                            "@vue/babel-plugin-jsx",
                            "@babel/plugin-transform-modules-commonjs",
                        ],
                    },
                }, 'ts-loader'],
            }, {
                test: /\.css$/,
                use: [CssExtractRspackPlugin.loader, 'css-loader', POSTCSS_LOADER_CONF],
            }, {
                test: /\.sc|ass$/,
                use: [CssExtractRspackPlugin.loader, 'css-loader', POSTCSS_LOADER_CONF, 'sass-loader']
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
        extensions: ['.ts', '.tsx', ".js", '.css', '.scss', '.sass'],
        tsConfig: join(__dirname, '..', 'tsconfig.json'),
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
    },
    optimization: {
        splitChunks: {
            chunks: chunkFilter,
            cacheGroups: {
                defaultVendors: {
                    filename: 'vendor/[name].js'
                }
            }
        },
    },
}

type Option = {
    outputPath: string
    manifest: chrome.runtime.ManifestV3 | chrome.runtime.ManifestFirefox
    mode: Configuration["mode"]
}

const generateOption = ({ outputPath, manifest, mode }: Option) => {
    const plugins = [
        ...generateJsonPlugins,
        new GenerateJsonPlugin(MANIFEST_JSON_NAME, manifest),
        // copy static resources
        new CopyRspackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '..', 'public', 'images'),
                    to: path.join(outputPath, 'static', 'images'),
                }
            ]
        }),
        new CssExtractRspackPlugin(),
        new HtmlRspackPlugin({
            filename: path.join('static', 'app.html'),
            title: 'Loading...',
            meta: {
                viewport: {
                    name: "viewport",
                    content: 'width=device-width',
                },
            },
            chunks: ['app'],
        }),
        new HtmlRspackPlugin({
            filename: path.join('static', 'popup.html'),
            chunks: ['popup'],
        }),
        new HtmlRspackPlugin({
            filename: path.join('static', 'popup_skeleton.html'),
            chunks: ['popup_skeleton'],
        }),
        new HtmlRspackPlugin({
            filename: path.join('static', 'side.html'),
            title: 'Loading...',
            chunks: ['side'],
        }),
        new DefinePlugin({
            // https://github.com/vuejs/vue-cli/pull/7443
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
            __VUE_OPTIONS_API__: false,
            __VUE_PROD_DEVTOOLS__: false,
            'process.env.VUE_TRUSTED_TYPES': false,
        }),
    ]
    const config: Configuration = {
        ...staticOptions,
        output: {
            path: outputPath,
            filename: '[name].js',
        },
        plugins, mode,
    }
    if (mode === "development") {
        // no eval with development, but generate *.map.js
        config.devtool = 'cheap-module-source-map'
    }
    return config
}

export default generateOption