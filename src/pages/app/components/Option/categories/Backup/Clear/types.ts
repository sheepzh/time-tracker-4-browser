export type ClearForm = {
    client?: tt4b.backup.Client
    result?: StatResult
}

export type StatResult = {
    rowCount: number
    hostCount: number
}
