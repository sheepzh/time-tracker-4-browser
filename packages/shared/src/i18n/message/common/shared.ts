import resource from "./shared-resource.json"

export type SharedMessage = {
    merge: {
        mergeBy: string
        mergeMethod: Record<timer.stat.MergeMethod, string> & { notMerge: string }
    }
    cate: {
        notSet: string
    }
}

const sharedMessages = resource satisfies Messages<SharedMessage>

export default sharedMessages