/**
 * Forbid importing @service, @db, or src/background from pages and content-script.
 * Only background entry may use them; pages and content-script must use @api/sw.
 */
import type { Compiler, ResolveData } from "@rspack/core"
import path from "path"

const FORBIDDEN_PREFIXES = ['@service', '@db']
function isForbiddenRequest(request: string): boolean {
    if (FORBIDDEN_PREFIXES.some(p => request.startsWith(p))) return true
    if (request.includes('src/background') || request.includes('src\\background')) return true
    return false
}

function isPagesOrContentScript(context: string): boolean {
    const n = path.normalize(context)
    return n.includes('content-script') || n.includes(path.sep + 'pages' + path.sep)
}

export class ForbidBackendInFrontendPlugin {
    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap('ForbidBackendInFrontendPlugin', (_compilation, { normalModuleFactory }) => {
            normalModuleFactory.hooks.beforeResolve.tap('ForbidBackendInFrontendPlugin', (resolveData: ResolveData) => {
                const request = resolveData.request
                const context = resolveData.context || ''
                if (!request || !isForbiddenRequest(request)) return
                if (!isPagesOrContentScript(context)) return

                const shortContext = context.replace(compiler.context, '').replace(/^\//, '') || context
                const err = new Error(
                    `[ForbidBackendInFrontend] Cannot import "${request}" from pages or content-script (context: ${shortContext}). Use @api/sw/<domain> instead.`
                )
                throw err
            })
        })
    }
}
