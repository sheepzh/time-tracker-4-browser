import { isRecord } from '@util/guard'
import { createObjectGuard, isInt, isString, TypeGuard } from 'typescript-guard'
import type { BrowserMigratableNamespace } from '../types'

export const isExportData = createObjectGuard<Pick<timer.backup.ExportData, '__meta__'>>({
    __meta__: createObjectGuard({
        version: isString,
        ts: isInt,
    }),
})

export const isLegacyVersion = (data: unknown): data is timer.backup.ExportData => {
    if (!isExportData(data)) return false

    const version = data.__meta__.version
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
    const majorStr = match?.[1]
    if (!majorStr) return true
    const major = parseInt(majorStr)

    return major < 4
}

export const extractNamespace = <T>(data: unknown, namespace: BrowserMigratableNamespace, guard: TypeGuard<T>): T | undefined => {
    if (!isRecord(data)) return undefined
    if (!(namespace in data)) return undefined
    const nsData = data[namespace]
    return guard(nsData) ? nsData : undefined
}