/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Build the manifest.json in chrome extension directory via this file
 *
 * @author zhy
 * @since 0.0.1
 */
// Not use path alias in manifest.json
import packageInfo from "./package"
import { OPTION_ROUTE } from "./pages/app/router/constants"
const { version, author: { email }, homepage } = packageInfo

const _default: chrome.runtime.ManifestV3 = {
    name: '__MSG_meta_marketName__',
    description: "__MSG_meta_description__",
    version,
    author: { email },
    default_locale: 'en',
    homepage_url: homepage,
    manifest_version: 3,
    icons: {
        16: "static/images/icon-16.png",
        48: "static/images/icon-48.png",
        128: "static/images/icon-128.png",
    },
    background: {
        service_worker: 'background.js'
    },
    content_scripts: [
        {
            matches: [
                "<all_urls>"
            ],
            js: [
                "content_scripts_skeleton.js",
            ],
            run_at: "document_start"
        }
    ],
    permissions: [
        'storage',
        'tabs',
        'contextMenus',
        'alarms',
        'scripting',
        'sidePanel',
    ],
    optional_permissions: [
        'tabGroups',
    ],
    host_permissions: [
        "<all_urls>",
    ],
    web_accessible_resources: [{
        resources: [
            'content_scripts.js',
            'content_scripts.css',
            'static/images/*',
            'static/popup.html',
        ],
        matches: ["<all_urls>"],
    }],
    action: {
        default_popup: "static/popup_skeleton.html",
        default_icon: "static/images/icon.png",
    },
    /**
     * @since 0.4.0
     */
    options_page: 'static/app.html#' + OPTION_ROUTE
}

export default _default