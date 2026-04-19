import db from "@db/stat-database"
import optionHolder from '../service/components/option-holder'

const handleRemove = (group: chrome.tabGroups.TabGroup) => db.deleteByGroup(group.id)

function handleTabGroupsEnabled(option: timer.option.TrackingOption) {
    // Do nothing if not enabled
    if (!option.countTabGroup) return
    try {
        chrome.tabGroups.onRemoved.removeListener(handleRemove)
        chrome.tabGroups.onRemoved.addListener(handleRemove)
    } catch (e) {
        console.warn('failed to handle event: enableTabGroup', e)
    }
}

export async function initTabGroup() {
    const option = await optionHolder.get()
    handleTabGroupsEnabled(option)

    optionHolder.addChangeListener(newVal => handleTabGroupsEnabled(newVal))
}