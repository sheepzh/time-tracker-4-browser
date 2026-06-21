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
        allowDelay: string
        unlimited: string
    }
    focus: {
        menu: string
        policy: Record<tt4b.focus.FilterPolicy, {
            label: string
            desc: string
        }>
        duration: string
        break: string
        method: Record<tt4b.focus.Method, {
            label: string
            desc: string
        }>
        noAllowUrl: string
        noBlockUrl: string
        noTime: string
        abort: string
        presetName: string
    }
    permGrantConfirm: string
}

const sharedMessages = resource satisfies Messages<SharedMessage>

export default sharedMessages