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
        deleteConfirmMsgAll: string
        deleteConfirmMsgRange: string
        deleteConfirmMsg: string
        analysis: string
    }
} & {
    [dimension in tt4b.core.Dimension]: string
} & {
    [dimension in tt4b.core.DimensionOptional]: string
}

const _default: Messages<ItemMessage> = resource

export default _default
