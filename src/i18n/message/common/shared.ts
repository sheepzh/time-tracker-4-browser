import resource from "./shared-resource.json"

export type SharedMessage = {
    merge: {
        mergeBy: string
        mergeMethod: Record<tt4b.stat.MergeMethod, string> & { notMerge: string }
    }
    cate: {
        notSet: string
    }
    limit: {
        daily: string
        weekly: string
        period: string
        visits: string
    }
    site: {
        type: Record<tt4b.site.Type, string>
    },
    permGrantConfirm: string
    followBrowser: string
    unlimited: string
    allowUnblocking: string
}

const sharedMessages = resource satisfies Messages<SharedMessage>

export default sharedMessages