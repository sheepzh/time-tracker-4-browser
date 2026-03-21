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
        merged: string
        virtual: string
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
        totalDay: string
        maxFocus: string
        averageFocus: string
        maxVisit: string
        averageVisit: string
        focusTitle: string
        visitTitle: string
    }
}

const _default: Messages<AnalysisMessage> = resource

export default _default