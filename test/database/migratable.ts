export function mockLegacyData(data: Record<string, unknown>): timer.backup.ExportData {
    const withMeta: timer.backup.ExportData = {
        ...data,
        __meta__: {
            version: "3.8.15",
            ts: Date.now(),
        },
    }
    return withMeta
}
