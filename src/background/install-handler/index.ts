import { locale } from '@/i18n'
import { onInstalled, setUninstallURL } from "@api/chrome/runtime"
import { executeScript } from "@api/chrome/script"
import { createTabAfterCurrent, listTabs } from "@api/chrome/tab"
import { updateInstallTime } from "@service/meta-service"
import { IS_E2E, IS_FROM_STORE } from "@util/constant/environment"
import { getGuidePageUrl, UNINSTALL_QUESTIONNAIRE } from "@util/constant/url"
import { isBrowserUrl } from "@util/pattern"
import versionManager from './version'

async function onFirstInstall() {
    updateInstallTime(Date.now())
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

export function initAfterInstalled() {
    onInstalled(async reason => {
        reason === "install" && await onFirstInstall()
        // Questionnaire for uninstall
        initQuestionnaire()
        // Reload content-script
        IS_FROM_STORE && await reloadContentScript()
        // Initialize with version
        versionManager.handle(reason)
    })
}