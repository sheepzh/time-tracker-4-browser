/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { createContextMenu, updateContextMenu } from "@api/chrome/context-menu"
import { getRuntimeId } from "@api/chrome/runtime"
import { getTab, onTabActivated, onTabUpdated } from "@api/chrome/tab"
import { IS_ANDROID, isNotTrackable } from "@util/constant/environment"
import { extractHostname } from "@util/pattern"
import { t } from './i18n'
import optionHolder from "./service/components/option-holder"
import whitelistHolder from './service/whitelist/holder'

const menuId = '_timer_menu_item_' + getRuntimeId()
let currentActiveId: number

const menuInitialOptions: ChromeContextMenuCreateProps = {
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio'],
    id: menuId,
    checked: true,
    title: 'foobar',
    visible: false
}

async function updateContextMenuInner(param: ChromeTab | number | undefined): Promise<void> {
    const tab = typeof param === 'number' ? await getTab(currentActiveId) : param
    const { url } = tab ?? {}

    const host = url && !isNotTrackable(url) ? extractHostname(url).host : undefined
    const visible = (await optionHolder.get())?.displayWhitelistMenu
    const changeProp: ChromeContextMenuUpdateProps = {}
    if (host && visible) {
        const exist = whitelistHolder.containsHost(host)
        changeProp.visible = visible
        changeProp.title = t(msg => msg.contextMenus[exist ? 'removeFromWhitelist' : 'add2Whitelist'], { host })
        changeProp.onclick = () => exist ? whitelistHolder.remove(host) : whitelistHolder.add(host)
    } else {
        // If not a valid host, hide this menu
        changeProp.visible = false
    }
    await updateContextMenu(menuId, changeProp)
}

const handleTabUpdated = (tabId: number, updatedInfo: ChromeTabUpdatedInfo, tab?: ChromeTab) => {
    // Current active tab updated
    tabId === currentActiveId
        && updatedInfo.status === 'loading'
        && updateContextMenuInner(tab)
}

const handleTabActivated = (activeInfo: ChromeTabActiveInfo) => updateContextMenuInner(currentActiveId = activeInfo.tabId)

async function initWhitelistMenuManager() {
    if (IS_ANDROID) {
        // context menu not supported for Android
        return
    }
    createContextMenu(menuInitialOptions)
    onTabUpdated(handleTabUpdated)
    onTabActivated((_tabId, activeInfo) => handleTabActivated(activeInfo))
    whitelistHolder.addPostHandler(() => updateContextMenuInner(currentActiveId))
}

export default initWhitelistMenuManager