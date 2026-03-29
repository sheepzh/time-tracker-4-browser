/**
 * @since 1.9.2
 */
declare namespace timer.imported {
    type ConflictResolution = 'overwrite' | 'accumulate'

    type Row = Required<timer.core.RowKey> & timer.core.Result & {
        exist?: timer.core.Result
    }

    type Data = {
        // Whether there is data for this dimension
        [dimension in timer.core.Dimension]?: boolean
    } & {
        rows: Row[]
    }

    type PreviewQuery =
        | { source: 'backup'; param: timer.backup.RemoteQuery }
        | { source: 'rows'; rows: Row[] }

    type ProcessQuery = {
        data: Data
        resolution: ConflictResolution
    }
}