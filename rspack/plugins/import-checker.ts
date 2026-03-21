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

const PLUGIN_NAME = 'ImportCheckerPlugin'
const BACKGROUND_DIR = 'src/background'

type IllegalImport = {
    issuerAbs: string
    targetAbs: string
}

const MAX_VIOLATION_PREVIEW = 10

function getModuleResource(module: Module): string | undefined {
    if (typeof module !== 'object') return undefined
    if (!('resource' in module)) return undefined
    const resource = module.resource
    return typeof resource === 'string' ? resource : undefined
}

function toWorkspaceRelative(absResource: string, context: string): string {
    return path.relative(context, path.normalize(absResource)).replace(/\\/g, '/')
}

function isUnderSrcBackground(absResource: string, context: string): boolean {
    const rel = toWorkspaceRelative(absResource, context)
    return rel === BACKGROUND_DIR || rel.startsWith(`${BACKGROUND_DIR}/`)
}

function allIssuerResources(compilation: Compilation, module: Module): string[] {
    const resources: string[] = []
    for (const conn of compilation.moduleGraph.getIncomingConnections(module)) {
        const origin = conn.originModule
        if (!origin) continue
        const resource = getModuleResource(origin)
        if (resource) resources.push(resource)
    }
    return resources
}

function buildViolationMessage(context: string, issuerAbs: string, targetAbs: string): string {
    const shortIssuer = toWorkspaceRelative(issuerAbs, context)
    const shortTarget = toWorkspaceRelative(targetAbs, context)
    return `${shortIssuer} -> ${shortTarget}`
}

function collectIllegalImports(compilation: Compilation, context: string): IllegalImport[] {
    const violations: IllegalImport[] = []

    for (const module of compilation.modules) {
        const targetAbs = getModuleResource(module)
        if (!targetAbs) continue
        if (!isUnderSrcBackground(targetAbs, context)) continue

        for (const issuerAbs of allIssuerResources(compilation, module)) {
            if (isUnderSrcBackground(issuerAbs, context)) continue
            violations.push({ issuerAbs, targetAbs })
        }
    }

    return violations
}

function buildSummaryError(violations: IllegalImport[], context: string): InstanceType<typeof WebpackError> | null {
    const seenMessages = new Set<string>()
    const lines: string[] = []

    for (const violation of violations) {
        const message = buildViolationMessage(context, violation.issuerAbs, violation.targetAbs)
        if (seenMessages.has(message)) continue
        seenMessages.add(message)
        if (lines.length < MAX_VIOLATION_PREVIEW) {
            lines.push(`- ${message}`)
        }
    }

    const total = seenMessages.size
    if (!total) return null

    const omitted = total - lines.length
    const header = `[${PLUGIN_NAME}] Illegal imports to ${BACKGROUND_DIR}: ${total}`
    const hint = `Only ${BACKGROUND_DIR} may import ${BACKGROUND_DIR} modules. Use @api/sw/<domain> instead.`
    const tail = omitted > 0 ? `... and ${omitted} more` : ''
    const summary = [header, ...lines, tail, hint].filter(Boolean).join('\n')

    return new WebpackError(summary)
}

function adaptDiagnostic(error: Error | null) {
    if (!error) return
    return {
        severity: JsRspackSeverity.Error,
        error,
    }
}

export class ImportCheckerPlugin implements RspackPluginInstance {
    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
            compilation.hooks.finishModules.tapAsync(PLUGIN_NAME, (_modules, callback) => {
                const context = compilation.compiler.context
                const violations = collectIllegalImports(compilation, context)
                const error = buildSummaryError(violations, context)

                adaptDiagnostic(error)
                callback(error)
            })
        })
    }
}
