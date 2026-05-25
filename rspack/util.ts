import type { Plugin, RspackOptions } from '@rspack/core'

export function enhancePluginWith(option: RspackOptions, ...toPush: Plugin[]) {
    const { plugins = [] } = option
    plugins.push(...toPush)
    option.plugins = plugins
}