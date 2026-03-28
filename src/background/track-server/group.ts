import db from "@db/stat-database"

const handleRemove = (group: chrome.tabGroups.TabGroup) => db.deleteByGroup(group.id)

export function handleTabGroupEnabled() {
    try {
        chrome.tabGroups.onRemoved.removeListener(handleRemove)
        chrome.tabGroups.onRemoved.addListener(handleRemove)
    } catch (e) {
        console.warn('failed to handle event: enableTabGroup', e)
    }
}