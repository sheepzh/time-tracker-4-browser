declare namespace timer.site {
    type SiteKey = {
        host: string
        type: timer.site.Type
    }
    type SiteInfo = SiteKey & {
        alias?: string
        iconUrl?: string
        /**
         * Category ID
         *
         * @since 3.0.0
         */
        cate?: number
        /**
         * Whether to count the running time
         *
         * @since 3.2.0
         */
        run?: boolean
    }
    type Type = 'normal' | 'merged' | 'virtual'
    /**
     * Site tag
     *
     * @since 3.0.0
     */
    type Cate = {
        id: number
        name: string
    }

    type Query = {
        fuzzyQuery?: string
        cateIds?: Arrayable<number>
        types?: Arrayable<timer.site.Type>
    }

    type PageQuery = Query & common.PageQuery

    type ChangeCateParam = {
        // Undefined means uncategorized
        cateId: number | undefined
        keys: SiteKey[]
    }

    type ChangeAliasParam = {
        key: SiteKey
        // Undefined means delete alias
        alias: string | undefined
    }
}