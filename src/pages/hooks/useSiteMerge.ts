import { getOption } from '@api/sw/option'
import { computed } from 'vue'
import { useRequest } from './useRequest'

export const useSiteMerge = () => {
    const { data: tabGroupEnabled } = useRequest(async () => {
        const option = await getOption()
        return option?.countTabGroup ?? false
    }, { defaultValue: false })

    const methods = computed(() => {
        const res: Exclude<tt4b.stat.MergeMethod, 'date'>[] = ['cate', 'domain']
        tabGroupEnabled.value && res.push('group')
        return res
    })

    return { methods, tabGroupEnabled }
}