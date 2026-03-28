export type ClearForm = {
    client?: timer.backup.Client
    result?: StatResult
}

export type StatResult = {
    rowCount: number
    hostCount: number
}
