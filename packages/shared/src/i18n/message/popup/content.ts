/**
 * Copyright (c) 2025-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { PopupDuration } from '@popup/context'
import resource from './content-resource.json'

export type ContentMessage = {
    percentage: {
        title: { [key in PopupDuration]: string }
        saveAsImageTitle: string
        averageTime: string
        averageCount: string
        totalTime: string
        totalCount: string
        otherLabel: string
    }
    ranking: {
        includingCount: string
    }
}

const contentMessages = resource as Messages<ContentMessage>

export default contentMessages