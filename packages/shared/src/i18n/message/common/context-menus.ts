/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './context-menus-resource.json'

/**
 * Used for menu
 */
export type ContextMenusMessage = {
    add2Whitelist: string
    removeFromWhitelist: string
    feedbackPage: string
}

const _default: Messages<ContextMenusMessage> = resource

export default _default