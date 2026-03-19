/**
 * Only files under src/background may import src/background modules.
 * Other code (pages, content-script, api/sw, etc.) must use @api/sw/<domain>.
 */
import { JsRspackSeverity } from "@rspack/binding"
import {
    Compiler,
    WebpackError,
    type Compilation,
    type Module,
    type RspackPluginInstance
} from "@rspack/core"
import path from "path"

function getModuleResource(module: Module): string | undefined {
    if (typeof module !== 'object') return undefined
    if (!('resource' in module)) return undefined
    const resource = module.resource
    return typeof resource === 'string' ? resource : undefined
}

function isUnderSrcBackground(absResource: string, context: string): boolean {
    const rel = path.relative(context, path.normalize(absResource)).replace(/\\/g, '/')
    return rel === 'src/background' || rel.startsWith('src/background/')
}

/** First NormalModule.resource in the issuer chain (immediate importer and up). */
function firstNormalIssuerResource(compilation: Compilation, module: Module): string | null {
    const seen = new Set<Module>()
    let current: Module | null = compilation.moduleGraph.getIssuer(module)
    while (current && !seen.has(current)) {
        seen.add(current)
        const resource = getModuleResource(current)
        if (resource) return resource
        current = compilation.moduleGraph.getIssuer(current)
    }
    return null
}

export class ImportCheckerPlugin implements RspackPluginInstance {
    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap('ImportCheckerPlugin', compilation => {
            compilation.hooks.finishModules.tapAsync('ImportCheckerPlugin', (_modules, callback) => {
                const context = compilation.compiler.context
                const errors: InstanceType<typeof WebpackError>[] = []

                for (const module of compilation.modules) {
                    const resource = getModuleResource(module)
                    if (!resource) continue
                    if (!isUnderSrcBackground(resource, context)) continue

                    const issuerRes = firstNormalIssuerResource(compilation, module)
                    if (!issuerRes) continue
                    if (isUnderSrcBackground(issuerRes, context)) continue

                    const shortIssuer = issuerRes.replace(context, '').replace(/^[\\/]/, '')
                    const shortTarget = resource.replace(context, '').replace(/^[\\/]/, '')

                    const msg =
                        `[ImportCheckerPlugin] Only src/background may import "${shortTarget}"; ` +
                        `illegal import from "${shortIssuer}". Use @api/sw/<domain> instead.`
                    errors.push(new WebpackError(msg))
                }

                for (const err of errors) {
                    compilation.__internal__pushRspackDiagnostic({
                        severity: JsRspackSeverity.Error,
                        error: err,
                    })
                }

                callback(errors.length ? errors[0] : undefined)
            })
        })
    }
}
