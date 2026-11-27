import { listAllGroups, onChanged, removeChangedHandler } from "@api/chrome/tabGroups"
import { computed } from "vue"
import { useMounted } from './useMounted'
import { useRequest } from "./useRequest"

export const useTabGroups = () => {
    const { data: groups, refresh } = useRequest(listAllGroups, { defaultValue: [] })
    const groupMap = computed(() => {
        var map: Record<number, chrome.tabGroups.TabGroup> = {}
        groups.value.forEach(g => map[g.id] = g)
        return map
    })

    useMounted(() => {
        onChanged(refresh)
        return () => removeChangedHandler(refresh)
    })

    return { groups, groupMap }
}