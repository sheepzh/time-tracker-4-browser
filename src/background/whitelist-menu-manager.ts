/**
 * Copyright (c) 2021 Hengyang Zhang
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import WhitelistDatabase from "@db/whitelist-database"
import optionService from "@service/option-service"
import { t2Chrome } from "@i18n/chrome/t"
import { ContextMenusMessage } from "@i18n/message/common/context-menus"
import { extractHostname, isBrowserUrl } from "@util/pattern"
import { getTab, onTabActivated, onTabUpdated } from "@api/chrome/tab"
import { createContextMenu, updateContextMenu } from "@api/chrome/context-menu"
import { getRuntimeId } from "@api/chrome/runtime"

const db = new WhitelistDatabase(chrome.storage.local)

const menuId = '_timer_menu_item_' + getRuntimeId()
let currentActiveId: number

let whitelist: string[] = []

let visible = true

const removeOrAdd = (removeOrAddFlag: boolean, host: string) => removeOrAddFlag ? db.remove(host) : db.add(host)

const menuInitialOptions: ChromeContextMenuCreateProps = {
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio'],
    id: menuId,
    checked: true,
    title: 'foobar',
    visible: false
}

async function updateContextMenuInner(param: ChromeTab | number) {
    if (typeof param === 'number') {
        // If number, get the tabInfo first
        const tab: ChromeTab = await getTab(currentActiveId)
        tab && updateContextMenuInner(tab)
    } else {
        const tab = param as ChromeTab
        const { url } = tab
        const targetHost = url && !isBrowserUrl(url) ? extractHostname(tab.url).host : ''
        const changeProp: ChromeContextMenuUpdateProps = {}
        if (!targetHost) {
            // If not a valid host, hide this menu
            changeProp.visible = false
        } else {
            // Else change the title
            const existsInWhitelist = whitelist.includes(targetHost)
            changeProp.visible = true && visible
            const titleMsgField: keyof ContextMenusMessage = existsInWhitelist ? 'removeFromWhitelist' : 'add2Whitelist'
            changeProp.title = t2Chrome(root => root.contextMenus[titleMsgField]).replace('{host}', targetHost)
            changeProp.onclick = () => removeOrAdd(existsInWhitelist, targetHost)
        }
        updateContextMenu(menuId, changeProp)
    }
}

const handleListChange = (newWhitelist: string[]) => {
    whitelist = newWhitelist
    updateContextMenuInner(currentActiveId)
}

const handleTabUpdated = (tabId: number, changeInfo: ChromeTabChangeInfo, tab: number | ChromeTab) => {
    // Current active tab updated
    tabId === currentActiveId
        && changeInfo.status === 'loading'
        && updateContextMenuInner(tab)
}

const handleTabActivated = (activeInfo: ChromeTabActiveInfo) => updateContextMenuInner(currentActiveId = activeInfo.tabId)

async function init() {
    createContextMenu(menuInitialOptions)
    onTabUpdated(handleTabUpdated)
    onTabActivated((_tabId, activeInfo) => handleTabActivated(activeInfo))
    whitelist = await db.selectAll()
    db.addChangeListener(handleListChange)
    visible = (await optionService.getAllOption()).displayWhitelistMenu
    optionService.addOptionChangeListener(option => visible = option.displayWhitelistMenu)
}

export default init
