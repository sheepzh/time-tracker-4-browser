export type ImportForm = {
    ext: OtherExtension
    file?: File
    data: timer.imported.Data
    resolution?: timer.imported.ConflictResolution
}

export type OtherExtension =
    | "webtime_tracker"
    | "web_activity_time_tracker"
    | "history_trends_unlimited"
