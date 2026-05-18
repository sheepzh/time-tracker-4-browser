export type ImportForm = {
    ext: OtherExtension
    file?: File
    data: tt4b.imported.Data
    resolution?: tt4b.imported.ConflictResolution
}

export type OtherExtension =
    | "webtime_tracker"
    | "web_activity_time_tracker"
    | "history_trends_unlimited"
