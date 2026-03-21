/**
 * Copyright (c) 2024-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { IS_MV3 } from "@util/constant/environment"

export default function initSidePanel() {
    if (!IS_MV3) return
    const sidePanel = chrome.sidePanel
    // sidePanel not supported for Firefox
    // Avoid `chrome.sidePanel.setOptions` to skip web-ext lint
    if (!sidePanel?.setOptions) return
    sidePanel.setOptions({ path: "/static/side.html" })
}