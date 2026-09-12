import { getOption } from '@api/sw/option'
import { IS_ANDROID } from '@util/constant/environment'
import { truthy } from '@util/lang'
import { computed } from 'vue'
import { useRequest } from './useRequest'

export const useSiteMerge = () => {
    const { data: option } = useRequest(getOption)
    const methods = computed<Exclude<tt4b.stat.MergeMethod, 'date'>[]>(
        () => truthy('cate', 'domain', option.value?.countTabGroup && !IS_ANDROID && 'group')
    )
    return methods
}