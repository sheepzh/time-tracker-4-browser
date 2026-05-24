/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './record-resource.json'

export type RecordMessage = {
    exportFileName: string
    total: string
    batchDelete: {
        noSelectedMsg: string
        confirmMsg: string
        confirmMsgAll: string
        confirmMsgRange: string
    }
    remoteReading: {
        on: string
        off: string
        table: {
            client: string
            localData: string
            value: string
            percentage: string
        }
    }
    noMore: string
}

const _default: Messages<RecordMessage> = resource

export default _default