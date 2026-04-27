/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { APP_OPTION_ROUTE, APP_REPORT_ROUTE } from "@/shared/route"
import { onIconClick } from "@api/chrome/action"
import { createContextMenu } from "@api/chrome/context-menu"
import { getRuntimeId } from "@api/chrome/runtime"
import { createTab } from "@api/chrome/tab"
import { locale } from "@i18n"
import { t2Chrome } from "@i18n/chrome/t"
import { IS_ANDROID, IS_MV3, IS_SAFARI } from "@util/constant/environment"
import {
    CHANGE_LOG_PAGE, GITHUB_ISSUE_ADD, SOURCE_CODE_PAGE, TU_CAO_PAGE,
    getAppPageUrl, getGuidePageUrl,
} from "@util/constant/url"

const APP_PAGE_URL = getAppPageUrl()

const baseProps: Partial<ChromeContextMenuCreateProps> = {
    // Cast unknown to fix the error with manifestV2
    // Because 'browser_action' will be replaced with 'action' in union type chrome.contextMenus.ContextType since V3
    // But 'action' does not work in V2
    contexts: [IS_MV3 ? 'action' : 'browser_action'],
    visible: true
}

function titleOf(prefixEmoji: string, title: string) {
    if (IS_SAFARI) {
        // Emoji does not work in Safari's context menu
        return title
    } else {
        return `${prefixEmoji} ${title}`
    }
}

const allFunctionProps: ChromeContextMenuCreateProps = {
    id: getRuntimeId() + '_timer_menu_item_app_link',
    title: titleOf('🏷️', t2Chrome(msg => msg.base.allFunction)),
    onclick: () => createTab(APP_PAGE_URL),
    ...baseProps
}

const optionPageProps: ChromeContextMenuCreateProps = {
    id: getRuntimeId() + '_timer_menu_item_option_link',
    title: titleOf('🥰', t2Chrome(msg => msg.base.option)),
    onclick: () => createTab(getAppPageUrl(APP_OPTION_ROUTE)),
    ...baseProps
}

const repoPageProps: ChromeContextMenuCreateProps = {
    id: getRuntimeId() + '_timer_menu_item_repo_link',
    title: titleOf('🍻', t2Chrome(msg => msg.base.sourceCode)),
    onclick: () => createTab(SOURCE_CODE_PAGE),
    ...baseProps
}

const feedbackPageProps: ChromeContextMenuCreateProps = {
    id: getRuntimeId() + '_timer_menu_item_feedback_link',
    title: titleOf('😿', t2Chrome(msg => msg.contextMenus.feedbackPage)),
    onclick: () => createTab(locale === 'zh_CN' ? TU_CAO_PAGE : GITHUB_ISSUE_ADD),
    ...baseProps
}

const guidePageProps: ChromeContextMenuCreateProps = {
    id: getRuntimeId() + '_timer_menu_item_guide_link',
    title: titleOf('📖', t2Chrome(msg => msg.base.guidePage)),
    onclick: () => createTab(getGuidePageUrl()),
    ...baseProps
}

const changeLogProps: ChromeContextMenuCreateProps = {
    id: getRuntimeId() + '_timer_menu_item_changelog',
    title: titleOf('📆', t2Chrome(msg => msg.base.changeLog)),
    onclick: () => createTab(CHANGE_LOG_PAGE),
    ...baseProps
}

function initBrowserAction() {
    createContextMenu(allFunctionProps)
    createContextMenu(optionPageProps)
    createContextMenu(repoPageProps)
    createContextMenu(feedbackPageProps)
    createContextMenu(guidePageProps)
    createContextMenu(changeLogProps)

    if (IS_ANDROID) {
        // Forbidden popup page
        onIconClick(() => createTab({ url: getAppPageUrl(APP_REPORT_ROUTE) }))
    }
}

export default initBrowserAction
