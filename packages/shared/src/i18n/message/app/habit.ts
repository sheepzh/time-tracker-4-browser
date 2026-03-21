/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './habit-resource.json'

export type HabitMessage = {
    common: {
        focusAverage: string
    }
    period: {
        title: string
        busiest: string
        idle: string
        chartType: {
            average: string
            trend: string
            stack: string
        }
        sizes: {
            fifteen: string
            halfHour: string
            hour: string
            twoHour: string
        }
    }
    site: {
        title: string
        histogramTitle: string
        exclusiveToday: string
        countTotal: string
        siteAverage: string
        distribution: {
            title: string
            aveTime: string
            aveVisit: string
            tooltip: string
        }
        trend: {
            siteCount: string
            title: string
        }
    }
}

const _default: Messages<HabitMessage> = resource

export default _default