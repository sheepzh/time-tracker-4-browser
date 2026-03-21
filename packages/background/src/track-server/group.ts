import { deleteByGroup } from '@/background/service/item-service'

const handleRemove = (group: chrome.tabGroups.TabGroup) => deleteByGroup(group.id)

export function handleTabGroupEnabled() {
    try {
        chrome.tabGroups.onRemoved.removeListener(handleRemove)
        chrome.tabGroups.onRemoved.addListener(handleRemove)
    } catch (e) {
        console.warn('failed to handle event: enableTabGroup', e)
    }
}