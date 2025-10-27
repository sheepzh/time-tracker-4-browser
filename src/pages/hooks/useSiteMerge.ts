import optionHolder from '@service/components/option-holder'
import { computed } from 'vue'
import { useRequest } from './useRequest'

type Options = {
    onGroupDisabled?: NoArgCallback
}

export const useSiteMerge = ({ onGroupDisabled }: Options) => {
    const { data: countTabGroup } = useRequest(() => optionHolder.get().then(o => o.countTabGroup), {
        defaultValue: false,
        onSuccess: v => !v && onGroupDisabled?.()
    })

    const mergeItems = computed(() => {
        const res: (Exclude<timer.stat.MergeMethod, 'date'>)[] = ['cate', 'domain']
        countTabGroup.value && res.push('group')
        return res
    })

    return { mergeItems, countTabGroup }
}