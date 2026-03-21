import { listAllGroups, onChanged, removeChangedHandler } from "@api/chrome/tabGroups"
import { computed, onMounted } from "vue"
import { useRequest } from "."

export const useTabGroups = () => {
    const { data: groups, refresh } = useRequest(listAllGroups, { defaultValue: [] })
    const groupMap = computed(() => {
        var map: Record<number, chrome.tabGroups.TabGroup> = {}
        groups.value.forEach(g => map[g.id] = g)
        return map
    })

    onMounted(() => {
        onChanged(refresh)
        return () => removeChangedHandler(refresh)
    })

    return { groups, groupMap }
}