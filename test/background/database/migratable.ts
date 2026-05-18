export function mockLegacyData(data: Record<string, unknown>): tt4b.backup.ExportData {
    const withMeta: tt4b.backup.ExportData = {
        ...data,
        __meta__: {
            version: "3.8.15",
            ts: Date.now(),
        },
    }
    return withMeta
}