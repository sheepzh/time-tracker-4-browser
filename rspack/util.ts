import { type RspackOptions, type RspackPluginInstance } from '@rspack/core'

export function enhancePluginWith(option: RspackOptions, ...toPush: RspackPluginInstance[]) {
    const { plugins = [] } = option
    plugins.push(...toPush)
    option.plugins = plugins
}