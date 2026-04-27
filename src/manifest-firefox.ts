/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Build the manifest.json in Firefox extension directory via this file
 *
 * @author zhy
 * @since 0.0.1
 */
import packageJson from "../package.json"

const { version, author: { name: authorName }, homepage } = packageJson

const _default: browser._manifest.WebExtensionManifest = {
    name: '__MSG_meta_marketName__',
    description: "__MSG_meta_description__",
    version,
    author: authorName,
    default_locale: 'en',
    homepage_url: homepage,
    manifest_version: 2,
    minimum_opera_version: '140',
    icons: {
        16: "static/images/icon-16.png",
        48: "static/images/icon-48.png",
        128: "static/images/icon-128.png",
    },
    background: {
        scripts: ['background.js'],
        persistent: false,
    },
    content_scripts: [
        {
            matches: [
                "<all_urls>"
            ],
            js: [
                "content_scripts.js",
            ],
            run_at: "document_start"
        }
    ],
    permissions: [
        'storage',
        'tabs',
        'contextMenus',
        'alarms',
        '<all_urls>',
    ],
    optional_permissions: [
        'tabGroups',
        'notifications',
    ],
    browser_action: {
        default_popup: "static/popup_skeleton.html",
        default_icon: "static/images/icon-128.png",
    },
    browser_specific_settings: {
        gecko: {
            id: '{a8cf72f7-09b7-4cd4-9aaa-7a023bf09916}',
            data_collection_permissions: {
                required: ['none'],
                optional: ['technicalAndInteraction'],
            },
        },
    },
    sidebar_action: {
        default_icon: "static/images/icon.png",
        default_panel: "static/side.html",
        open_at_install: false,
    },
}

export default _default
