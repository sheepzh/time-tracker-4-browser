export type ModifyInstance = {
    add: NoArgCallback
}

export type DisplayComponent = {
    refresh: NoArgCallback
    getSelected: () => tt4b.site.SiteInfo[]
}