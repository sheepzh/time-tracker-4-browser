/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './analysis-resource.json'

export type AnalysisMessage = {
    target: {
        site: string
        cate: string
    }
    common: {
        focusTotal: string
        visitTotal: string
        hostPlaceholder: string
        emptyDesc: string
    }
    summary: {
        title: string
        day: string
        firstDay: string
        calendarTitle: string
    }
    trend: {
        title: string
        activeDay: string
        focusMax: string
        focusAverage: string
        visitMax: string
        visitAverage: string
        focusTitle: string
        visitTitle: string
        daily: string
        weekly: string
    }
}

const _default: Messages<AnalysisMessage> = resource

export default _default