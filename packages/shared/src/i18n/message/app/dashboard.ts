/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './dashboard-resource.json'

export type DashboardMessage = {
    heatMap: {
        title0: string
        title1: string
    },
    topK: {
        title: string
    }
    indicator: {
        installedDays: string
        visitCount: string
        browsingTime: string
        mostUse: string
    }
    monthOnMonth: {
        title: string
    }
    timeline: {
        title: string
        busyScore: string
        busyScoreDesc: string
        focusScore: string
        focusScoreDesc: string
    }
}

const _default: Messages<DashboardMessage> = resource

export default _default
