declare namespace timer.common {
    type Result<T> = {
        success: true
        data: T
    } | {
        success: false
        errorMsg: string
    }

    type PageQuery = {
        num?: number
        size?: number
    }

    type PageResult<T> = {
        list: T[]
        total: number
    }

    type SortDirection = 'ASC' | 'DESC'
    type SortBy<T extends string> = {
        sortKey?: T
        sortDirection?: SortDirection
    }

    /**
     * chrome.storage.local usage (mq memory.getUsedStorage).
     */
    type StorageUsage = {
        used: number
        total: number
    }
}