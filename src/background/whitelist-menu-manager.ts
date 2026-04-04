/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { createContextMenu, updateContextMenu } from "@api/chrome/context-menu"
import { getRuntimeId } from "@api/chrome/runtime"
import { getTab, onTabActivated, onTabUpdated } from "@api/chrome/tab"
import { t2Chrome } from "@i18n/chrome/t"
import { IS_ANDROID } from "@util/constant/environment"
import { extractHostname, isBrowserUrl } from "@util/pattern"
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

    const targetHost = url && !isBrowserUrl(url) ? extractHostname(url).host : undefined
    const visible = (await optionHolder.get())?.displayWhitelistMenu
    const changeProp: ChromeContextMenuUpdateProps = {}
    if (targetHost && visible) {
        const exist = whitelistHolder.containsHost(targetHost)
        changeProp.visible = visible
        changeProp.title = t2Chrome(root => root.contextMenus[exist ? 'removeFromWhitelist' : 'add2Whitelist'])
            .replace('{host}', targetHost)
        changeProp.onclick = () => exist ? whitelistHolder.remove(targetHost) : whitelistHolder.add(targetHost)
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