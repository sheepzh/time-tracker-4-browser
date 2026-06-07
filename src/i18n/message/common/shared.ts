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
        mode: Record<tt4b.focus.Mode, {
            label: string
            desc: string
        }>
        duration: string
        break: string
        addPreset: string
        template: Record<tt4b.focus.Template, {
            label: string
            desc: string
        }>
        noAllowUrl: string
        noBlockUrl: string
        noTime: string
        abort: string
    }
    permGrantConfirm: string
}

const sharedMessages = resource satisfies Messages<SharedMessage>

export default sharedMessages