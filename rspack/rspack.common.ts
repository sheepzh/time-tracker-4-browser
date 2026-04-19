import {
    CopyRspackPlugin, CssExtractRspackPlugin, DefinePlugin, HtmlRspackPlugin,
    type Chunk, type Configuration, type Module, type RspackPluginInstance, type RuleSetRule
} from "@rspack/core"
import { default as VueBabelPluginJsx } from "@vue/babel-plugin-jsx"
import path, { join } from "path"
import postcssRTLCSS from 'postcss-rtlcss'
import ElementPlus from 'unplugin-element-plus/rspack'
import i18nChrome from "../src/i18n/chrome"
import { compilerOptions } from "../tsconfig.json"
import { GenerateJsonPlugin } from "./plugins/generate-json"
import ImportCheckerPlugin, { isBgPath } from "./plugins/import-checker"

const MANIFEST_JSON_NAME = "manifest.json"

const generateJsonPlugins: RspackPluginInstance[] = []

const localeJsonFiles = Object.entries(i18nChrome)
    .map(([locale, message]) => new GenerateJsonPlugin(`_locales/${locale}/messages.json`, message))
generateJsonPlugins.push(...localeJsonFiles)

type EntryConfig = {
    name: string
    path: string
}

const BACKGROUND = 'background'
const CONTENT_SCRIPT = 'content_scripts'
const CONTENT_SCRIPT_LIMIT = 'content_scripts_limit'
const POPUP = 'popup'

const entryConfigs: EntryConfig[] = [{
    name: BACKGROUND,
    path: './src/background',
}, {
    name: CONTENT_SCRIPT,
    path: './src/content-script',
}, {
    name: CONTENT_SCRIPT_LIMIT,
    path: './src/content-script/limit/modal',
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
    return !name || ![BACKGROUND, CONTENT_SCRIPT].includes(name)
}

const isBackgroundModule = (module: Module) => isBgPath(module.nameForCondition?.() ?? '')

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
                        plugins: [
                            VueBabelPluginJsx,
                            "@emotion/babel-plugin",
                        ],
                    },
                }, {
                    loader: 'builtin:swc-loader',
                    options: {
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                                tsx: true,
                            },
                            transform: {
                                react: {
                                    runtime: 'preserve',
                                },
                            },
                            target: compilerOptions.target,
                        },
                    },
                }],
            }, {
                test: /\.css$/,
                use: [CssExtractRspackPlugin.loader, 'css-loader', POSTCSS_LOADER_CONF],
            }, {
                test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
                type: 'asset/resource'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.css'],
        tsConfig: join(__dirname, '..', 'tsconfig.json'),
        conditionNames: ['import', 'module', 'browser', 'default'],
        alias: {
            'element-plus/es/components/loading-service/style/css': 'element-plus/es/components/loading/style/css',
            'element-plus/es/components/loading-directive/style/css': 'element-plus/es/components/loading/style/css',
            'element-plus/es/components/auto-resizer/style/css': 'element-plus/es/components/table-v2/style/css',
        },
    },
    optimization: {
        splitChunks: {
            chunks: chunkFilter,
            maxInitialRequests: 30,
            maxAsyncRequests: 30,
            cacheGroups: {
                echarts: {
                    test: /[\\/]node_modules[\\/]echarts[\\/]/,
                    name: 'vendor/echarts',
                    filename: 'vendor/echarts.js',
                    priority: 40,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                elementPlus: {
                    test: /[\\/]node_modules[\\/]element-plus[\\/]/,
                    name: 'vendor/element-plus',
                    filename: 'vendor/element-plus.js',
                    priority: 39,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                elementIcons: {
                    test: /[\\/]node_modules[\\/]@element-plus[\\/]icons-vue[\\/]/,
                    name: 'vendor/el-icons',
                    filename: 'vendor/el-icons.js',
                    priority: 38,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                vue: {
                    test: /[\\/]node_modules[\\/](vue|@vue|vue-router|@vueuse)[\\/]/,
                    name: 'vendor/vue',
                    filename: 'vendor/vue.js',
                    priority: 37,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                dayjs: {
                    test: /[\\/node_modules][\\/]dayjs[\\/]/,
                    priority: 37,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                memoizeOne: {
                    test: /[\\/node_modules][\\/]memoize\\-one[\\/]/,
                    priority: 37,
                    reuseExistingChunk: true,
                    enforce: true,
                },
                /**
                 * Exclude src/background from the default shared chunk group so those files are
                 * never pulled into vendor/* (merging into entry name: 'background' panics in Rspack).
                 */
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                    test: module => !isBackgroundModule(module),
                },
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    filename: 'vendor/[name].js',
                    priority: -10,
                    reuseExistingChunk: true,
                },
            }
        },
    },
}

type Option = {
    outputPath: string
    manifest: chrome.runtime.ManifestV3 | browser._manifest.WebExtensionManifest
    mode: Configuration["mode"]
}

const generateOption = ({ outputPath, manifest, mode }: Option) => {
    const plugins = [
        ...generateJsonPlugins,
        ElementPlus({}),
        new GenerateJsonPlugin(MANIFEST_JSON_NAME, manifest),
        new ImportCheckerPlugin(),
        // copy static resources
        new CopyRspackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '..', 'public', 'images'),
                    to: path.join(outputPath, 'static', 'images'),
                }
            ]
        }),
        new CssExtractRspackPlugin({ ignoreOrder: true }),
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
            filename: path.join('static', 'limit.html'),
            title: 'Loading...',
            chunks: [CONTENT_SCRIPT_LIMIT],
            meta: {
                viewport: {
                    name: "viewport",
                    content: 'width=device-width',
                },
            }
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
            ...staticOptions.output,
            path: outputPath,
            filename: '[name].js',
        },
        plugins, mode,
        // no eval with development, but generate *.map.js
        devtool: mode === 'development' ? 'cheap-module-source-map' : false,
    }
    return config
}

export default generateOption