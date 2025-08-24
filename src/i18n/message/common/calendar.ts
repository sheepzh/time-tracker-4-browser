/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './calendar-resource.json'

export type CalendarMessage = {
    weekDays: string
    months: string
    dateFormat: string
    timeFormat: string
    monthDateFormat: string
    simpleTimeFormat: string
    label: {
        startDate: string
        endDate: string
    }
    range: {
        everyday: string
        today: string
        yesterday: string
        thisWeek: string
        thisMonth: string
        lastDays: string
        tillYesterday: string
        tillDaysAgo: string
        allTime: string
    }
}

const calendarMessages: Messages<CalendarMessage> = resource

export default calendarMessages