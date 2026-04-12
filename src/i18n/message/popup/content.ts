/**
 * Copyright (c) 2025-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './content-resource.json'

type PopupDuration =
    | "today" | "yesterday" | "thisWeek" | "thisMonth"
    | "lastDays"
    | "allTime"

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