import { onInstalled } from "@api/chrome/runtime"
import { executeScript } from "@api/chrome/script"
import { createTabAfterCurrent, listTabs } from "@api/chrome/tab"
import { updateInstallTime } from "@service/meta-service"
import { IS_E2E, IS_FROM_STORE } from "@util/constant/environment"
import { getGuidePageUrl } from "@util/constant/url"
import { isBrowserUrl } from "@util/pattern"
import UninstallListener from './uninstall-listener'

async function onFirstInstall() {
    updateInstallTime(new Date())
    !IS_E2E && createTabAfterCurrent(getGuidePageUrl())
}

async function reloadContentScript() {
    const files = chrome.runtime.getManifest().content_scripts?.[0]?.js
    if (!files?.length) {
        return
    }
    const tabs = await listTabs()
    tabs.filter(({ url }) => url && !isBrowserUrl(url))
        .forEach(({ id: tabId }) => tabId && executeScript(tabId, files))
}

export default function handleInstall() {
    onInstalled(async reason => {
        reason === "install" && await onFirstInstall()
        // Questionnaire for uninstall
        new UninstallListener().listen()
        // Reload content-script
        IS_FROM_STORE && await reloadContentScript()
    })
}