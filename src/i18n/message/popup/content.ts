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
        shareTitle: string
        installTip: string
        averageTime: string
        averageCount: string
        totalTime: string
        totalCount: string
        otherLabel: string
    }
    ranking: {
        includingCount: string
    }
    limit: {
        noData: string
        newOne: string
        remain: string
        noLimit: string
        notHit: string
    }
    site: {
        daily: string
        subpageBtn: string
        notTrackable: string
    }
}

const contentMessages = resource satisfies Messages<ContentMessage>

export default contentMessages