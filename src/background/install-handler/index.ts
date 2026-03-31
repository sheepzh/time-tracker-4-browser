import { locale } from '@/i18n'
import { onInstalled, setUninstallURL } from "@api/chrome/runtime"
import { executeScript } from "@api/chrome/script"
import { createTabAfterCurrent, listTabs } from "@api/chrome/tab"
import { updateInstallTime } from "@service/meta-service"
import { IS_E2E, IS_FROM_STORE, IS_MV3 } from "@util/constant/environment"
import { getGuidePageUrl, UNINSTALL_QUESTIONNAIRE } from "@util/constant/url"
import { isBrowserUrl } from "@util/pattern"
import initBrowserAction from './browser-action'
import versionManager from './version'

async function onFirstInstall() {
    updateInstallTime(new Date())
    !IS_E2E && createTabAfterCurrent(getGuidePageUrl())
}

async function reloadContentScript() {
    const files = chrome.runtime.getManifest().content_scripts?.[0]?.js
    if (!files?.length) return
    const tabs = await listTabs()
    tabs.filter(({ url }) => url && !isBrowserUrl(url))
        .forEach(({ id: tabId }) => tabId && executeScript(tabId, files))
}

function initQuestionnaire() {
    try {
        setUninstallURL(UNINSTALL_QUESTIONNAIRE[locale] ?? UNINSTALL_QUESTIONNAIRE['en'])
    } catch (e) {
        console.error("Failed to set uninstall URL", e)
    }
}

function initSidePanel() {
    if (!IS_MV3) return
    const sidePanel = chrome.sidePanel
    // sidePanel not supported for Firefox
    // Avoid `chrome.sidePanel.setOptions` to skip web-ext lint
    if (!sidePanel?.setOptions) return
    sidePanel.setOptions({ path: "/static/side.html" })
}

export function initAfterInstalled() {
    onInstalled(async reason => {
        reason === "install" && await onFirstInstall()
        // Questionnaire for uninstall
        initQuestionnaire()
        // Reload content-script
        IS_FROM_STORE && await reloadContentScript()
        // Initialize side panel
        initSidePanel()
        // Initialize context menu
        initBrowserAction()
        // Initialize with version
        versionManager.handle(reason)
    })
}