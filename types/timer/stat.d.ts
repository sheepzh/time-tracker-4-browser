declare namespace timer.stat {
    type SiteTarget = {
        siteKey: timer.site.SiteKey
    }
    type CateTarget = {
        cateKey: number
    }
    type GroupTarget = {
        groupKey: number
    }
    type TargetKey = SiteTarget | CateTarget | GroupTarget
    type DateKey = { date?: string }
    type StatKey = TargetKey & DateKey

    type DateMergeExtend = {
        /**
         * The merged dates
         *
         * @since 2.4.7
         */
        mergedDates?: string[]
    }

    type RemoteExtend = {
        /**
         * The composition of data when querying remote
         */
        composition?: RemoteComposition
    }

    /** StatCondition.date fields only (mq / stat-database queries). */
    type _BaseQuery = {
        date?: string | [string?, string?]
        mergeDate?: boolean
    }

    type SiteQuery =
        & _BaseQuery
        & {
            focusRange?: Vector<2>
            timeRange?: [number, number?]
            virtual?: boolean
        }
        & timer.common.SortBy<'date' | 'host' | timer.core.Dimension>
        & {
            query?: string
            host?: string | string[]
            mergeHost?: boolean
            inclusiveRemote?: boolean
            cateIds?: number[]
            ignoreSite?: boolean
        }

    type SitePageQuery = SiteQuery & timer.common.PageQuery

    type SiteRowFlat = SiteTarget &
        DateKey &
        core.Result &
        backup.RowExtend &
        DateMergeExtend &
        RemoteExtend & {
            /**
             * Icon url
             */
            iconUrl?: string
            /**
             * The alias name of this Site, always is the title of its homepage by detected
             */
            alias?: string
            /**
             * @since 3.0.0
             */
            cateId?: number
        }

    type SiteMergeExtend = {
        /**
         * The merged domains
         * Can't be empty if merged
         *
         * @since 0.1.5
         */
        mergedRows?: SiteRowFlat[]
    }

    type SiteRow = SiteRowFlat & SiteMergeExtend

    type CateQuery = _BaseQuery
        & timer.common.SortBy<'date' | 'focus' | 'time'>
        & {
            query?: string
            inclusiveRemote?: boolean
            cateIds?: number[]
        }

    type CatePageQuery = CateQuery & timer.common.PageQuery

    type CateRowFlat = CateTarget &
        DateKey &
        core.Result &
        backup.RowExtend &
        DateMergeExtend &
        RemoteExtend & {
            cateName: string | undefined
        }

    type CateMergeExtend = {
        mergedRows?: SiteRowFlat[]
    }

    type CateRow = CateRowFlat & CateMergeExtend

    type GroupRowFlat = GroupTarget &
        DateKey &
        DateMergeExtend &
        core.Result & {
            color: `${chrome.tabGroups.Color}` | undefined
            title: string | undefined
        }

    type GroupQuery = _BaseQuery
        & timer.common.SortBy<'date' | 'title' | 'focus' | 'time'>
        & {
            query?: string
            groupIds?: number[]
        }

    type GroupPageQuery = GroupQuery & timer.common.PageQuery

    type GroupMergeExtend = {
        mergedRows?: GroupRowFlat[]
    }

    type GroupRow = GroupRowFlat & GroupMergeExtend

    /**
     * Row of each statistics result
     */
    type Row = SiteRow | CateRow | GroupRow

    type RemoteCompositionVal =
        // Means local data
        number | {
            /**
             * Client's id
             */
            cid: string
            /**
             * Client's name
             */
            cname?: string
            value: number
        }

    /**
     * @since 1.4.7
     */
    type RemoteComposition = {
        [item in core.Dimension]: RemoteCompositionVal[]
    }

    /**
     * @since 3.0.0
     */
    type MergeMethod = 'cate' | 'date' | 'domain' | 'group'
}