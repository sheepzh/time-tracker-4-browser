import itemService from '@service/item-service'

function handleTabGroupRemove(group: chrome.tabGroups.TabGroup) {
    itemService.batchDeleteGroupById(group.id)
}

export function handleTabGroupEnabled() {
    try {
        chrome.tabGroups.onRemoved.removeListener(handleTabGroupRemove)
        chrome.tabGroups.onRemoved.addListener(handleTabGroupRemove)
    } catch (e) {
        console.warn('failed to handle event: enableTabGroup', e)
    }
}