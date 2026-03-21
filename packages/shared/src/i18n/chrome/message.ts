/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import baseMessages, { type BaseMessage } from "../message/common/base"
import contextMenusMessages, { type ContextMenusMessage } from "../message/common/context-menus"
import initialMessages, { type InitialMessage } from "../message/common/initial"
import metaMessages, { type MetaMessage } from "../message/common/meta"
import { merge, type MessageRoot } from "../message/merge"

export type ChromeMessage = {
    meta: MetaMessage
    base: BaseMessage
    contextMenus: ContextMenusMessage
    initial: InitialMessage
}

const MESSAGE_ROOT: MessageRoot<ChromeMessage> = {
    meta: metaMessages,
    base: baseMessages,
    contextMenus: contextMenusMessages,
    initial: initialMessages,
}

const messages = merge<ChromeMessage>(MESSAGE_ROOT)

export default messages

const placeholder: ChromeMessage = {
    meta: {
        name: '',
        description: '',
        marketName: '',
    },
    base: {
        sidebar: '',
        allFunction: '',
        guidePage: '',
        changeLog: '',
        option: '',
        sourceCode: '',
    },
    contextMenus: {
        add2Whitelist: '',
        removeFromWhitelist: '',
        feedbackPage: '',
    },
    initial: {
        localFile: {
            pdf: '',
            json: '',
            pic: '',
            txt: '',
        }
    }
}

function routerPath(root: any, parentPath = '') {
    Object.entries(root)
        .forEach(([key, value]) => {
            const currentPath = parentPath ? `${parentPath}_${key}` : key
            if (typeof value === 'string') {
                root[key] = currentPath
            } else {
                root[key] = routerPath(value, currentPath)
            }
        })
    return root
}

export const router: ChromeMessage = routerPath(placeholder) as unknown as ChromeMessage
