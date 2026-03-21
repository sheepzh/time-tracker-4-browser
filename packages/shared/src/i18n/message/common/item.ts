/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './item-resource.json'

export type ItemMessage = {
    date: string
    host: string
    group: string
    operation: {
        add2Whitelist: string
        deleteConfirmMsgAll: string
        deleteConfirmMsgRange: string
        deleteConfirmMsg: string
        analysis: string
        exportWholeData: string
        importWholeData: string
        importOtherData: string
    }
} & {
    [dimension in timer.core.Dimension]: string
}

const _default: Messages<ItemMessage> = resource

export default _default
