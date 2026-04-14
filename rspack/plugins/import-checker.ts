import type { Compiler, Module, ModuleGraph, RspackPluginInstance } from '@rspack/core'
import { NormalModule } from '@rspack/core'

/**
 * Can't import content-script & pages for background
 * Can't import background for content-script & pages
 */
class ImportCheckerPlugin implements RspackPluginInstance {
    static readonly NAME = 'ImportCheckerPlugin'

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(ImportCheckerPlugin.NAME, compilation => {
            const moduleGraph = compilation.moduleGraph
            compilation.hooks.finishModules.tap(
                ImportCheckerPlugin.NAME,
                modules => {
                    for (const mod of modules) {
                        processModule(mod, moduleGraph)
                    }
                },
            )
        })
    }
}

function processModule(mod: Module, moduleGraph: ModuleGraph) {
    const resource = moduleFilesystemPath(mod)
    if (!resource) return

    const incoming = moduleGraph.getIncomingConnections(mod)
    if (!incoming?.length) return

    for (const conn of incoming) {
        const originMod = conn.originModule
        if (!originMod) continue
        const issuer = moduleFilesystemPath(originMod)
        if (!issuer) continue
        const err = verify(issuer, resource)
        if (err) throw err
    }
}

function verify(issuer: string, resource: string): Error | undefined {
    const issuerPath = normalizePath(issuer)
    const resourcePath = normalizePath(resource)

    const issuerInBg = isBgPath(issuerPath)
    const issuerInOthers = isCsOrPagePath(issuerPath)

    const resourceInBg = isBgPath(resourcePath)
    const resourceInOthers = isCsOrPagePath(resourcePath)

    if (issuerInBg && resourceInOthers) {
        return new Error(
            `[${ImportCheckerPlugin.NAME}] background must not import content-script or pages.\n`
            + `  From: ${issuer}\n`
            + `  To:   ${resource}`,
        )
    }

    if (issuerInOthers && resourceInBg) {
        return new Error(
            `[${ImportCheckerPlugin.NAME}] content-script and pages must not import background.\n`
            + `  From: ${issuer}\n`
            + `  To:   ${resource}`,
        )
    }
}

function moduleFilesystemPath(mod: Module): string | undefined {
    if (mod instanceof NormalModule) {
        const { resource } = mod
        if (resource) return resource
    }
    return mod.nameForCondition()
}

function normalizePath(p: string): string {
    return p.replace(/\\/g, '/')
}

export function isBgPath(path: string): boolean {
    return isUnder(normalizePath(path), 'background')
}

function isCsOrPagePath(path: string): boolean {
    return isUnder(path, 'content-script') || isUnder(path, 'pages')
}

function isUnder(path: string, segment: string): boolean {
    const marker = `/src/${segment}/`
    if (path.includes(marker)) return true
    const suffix = `/src/${segment}`
    return path.endsWith(suffix)
}

export default ImportCheckerPlugin
