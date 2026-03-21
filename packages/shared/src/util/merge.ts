type Method = timer.stat.MergeMethod

export const ALL_MERGE_METHODS: Method[] = ['date', 'domain', 'cate', 'group']

function judgeAdded(target: Method, newVal: Method[], oldVal: Method[]): boolean {
    return newVal?.includes?.(target) && !oldVal?.includes?.(target)
}

export function processNewMethod(oldVal: Method[] | undefined, newVal: Method[]): Method[] {
    oldVal = oldVal || []
    if (judgeAdded('cate', newVal, oldVal)) {
        // Add cate, so remove domain
        return newVal.filter?.(v => v !== 'domain')
    }
    if (judgeAdded('domain', newVal, oldVal)) {
        // Add domain, so remove cate
        return newVal.filter?.(v => v !== 'cate')
    }
    return newVal
}