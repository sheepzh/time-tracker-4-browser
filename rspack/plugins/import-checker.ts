import type { Compiler, Module, RspackPluginInstance } from '@rspack/core'

/**
 * Can't import content-script & pages for background
 * Can't import background for content-script & pages
 */
class ImportCheckerPlugin implements RspackPluginInstance {
    private static readonly NAME = 'ImportCheckerPlugin'
    private static readonly MSG_PREFIX = '[ImportCheckerPlugin] '

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(ImportCheckerPlugin.NAME, compilation => {
            compilation.hooks.finishModules.tap(ImportCheckerPlugin.NAME, modules => {
                for (const m of modules as Iterable<Module>) {
                    const mod = m as Module & { resource?: string }
                    const resource = mod.resource ?? mod.nameForCondition?.()
                    if (!resource) {
                        continue
                    }
                    const issuerMod = compilation.moduleGraph.getIssuer(mod) as (Module & { resource?: string }) | null
                    const issuer = issuerMod?.resource ?? issuerMod?.nameForCondition?.()
                    if (!issuer) {
                        continue
                    }
                    const err = ImportCheckerPlugin.verify(issuer, resource)
                    if (err) {
                        throw err
                    }
                }
            })
        })
    }

    private static verify(issuer: string, resource: string): Error | undefined {
        const issuerPath = normalizePath(issuer)
        const resourcePath = normalizePath(resource)

        const issuerInBg = isBgPath(issuerPath)
        const issuerInOthers =
            isUnderSrc(issuerPath, 'content-script') || isUnderSrc(issuerPath, 'pages')

        const resourceInBg = isBgPath(resourcePath)
        const resourceInOthers =
            isUnderSrc(resourcePath, 'content-script') || isUnderSrc(resourcePath, 'pages')

        if (issuerInBg && resourceInOthers) {
            return new Error(
                `${ImportCheckerPlugin.MSG_PREFIX}background must not import content-script or pages.\n`
                + `  From: ${issuer}\n`
                + `  To:   ${resource}`,
            )
        }

        if (issuerInOthers && resourceInBg) {
            return new Error(
                `${ImportCheckerPlugin.MSG_PREFIX}content-script and pages must not import background.\n`
                + `  From: ${issuer}\n`
                + `  To:   ${resource}`,
            )
        }

        return undefined
    }
}

function normalizePath(p: string): string {
    return p.replace(/\\/g, '/')
}

export function isBgPath(path: string): boolean {
    return isUnderSrc(normalizePath(path), 'background')
}

function isUnderSrc(normalizedAbsPath: string, segment: string): boolean {
    const marker = `/src/${segment}/`
    if (normalizedAbsPath.includes(marker)) {
        return true
    }
    const suffix = `/src/${segment}`
    return normalizedAbsPath.endsWith(suffix)
}

export default ImportCheckerPlugin
