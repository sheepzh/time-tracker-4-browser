import { GRID_CELL_STYLE } from "@app/components/common/grid"
import { KanbanIndicatorCell } from "@app/components/common/kanban"
import { t } from "@app/locale"
import { periodFormatter } from "@app/util/time"
import { useXsState } from "@hooks"
import Flex from "@pages/components/Flex"
import { averageByDay } from "@util/period"
import { formatTime } from "@util/time"
import { computed, defineComponent } from "vue"
import { useHabitFilter } from "../context"
import { usePeriodFilter, usePeriodValue } from "./context"

type Result = {
    favorite: {
        period: string
        average: number
    }
    longestIdle: {
        length: string
        period: string
    }
}

const computeSummary = (rows: timer.period.Row[], periodSize: number): Result => {
    const averaged = averageByDay(rows, periodSize)
    const favoriteRow = averaged.sort((b, a) => a.milliseconds - b.milliseconds)[0]
    let favoritePeriod = '-'
    if (favoriteRow) {
        const start = favoriteRow.startTime
        const end = favoriteRow.endTime
        favoritePeriod = `${formatTime(start, "{h}:{i}")}-${formatTime(end, "{h}:{i}")}`
    }

    let maxIdle: [timer.period.Row | undefined, timer.period.Row | undefined, number] = [, , 0]

    let idleStart: timer.period.Row | undefined
    let idleEnd: timer.period.Row | undefined
    rows.forEach(r => {
        if (r.milliseconds) {
            if (!idleStart || !idleEnd) return
            const newEmptyTs = idleEnd.endTime.getTime() - idleStart.endTime.getTime()
            if (newEmptyTs > maxIdle[2]) {
                maxIdle = [idleStart, idleEnd, newEmptyTs]
            }
            idleStart = idleEnd = undefined
        } else {
            idleEnd = r
            !idleStart && (idleStart = idleEnd)
        }
    })

    const [start, end] = maxIdle

    let idleLength = '-'
    let idlePeriod = ''
    if (start && end) {
        idleLength = periodFormatter(end.endTime.getTime() - start.startTime.getTime(), { format: 'hour' })
        const format = t(msg => msg.calendar.simpleTimeFormat)
        const startTime = formatTime(start.startTime, format)
        const endTime = formatTime(end.endTime, format)
        idlePeriod = startTime + '-' + endTime
    }

    return {
        favorite: {
            period: favoritePeriod,
            average: favoriteRow?.milliseconds,
        },
        longestIdle: {
            length: idleLength,
            period: idlePeriod,
        }
    }
}

const _default = defineComponent(() => {
    const data = usePeriodValue()
    const filter = usePeriodFilter()
    const globalFilter = useHabitFilter()
    const summary = computed(() => computeSummary(data.value?.curr, filter.periodSize))
    const isXs = useXsState()

    return () => (
        <Flex column gap={1} flex={isXs.value ? undefined : 1}>
            <KanbanIndicatorCell
                mainName={t(msg => msg.habit.period.busiest)}
                mainValue={summary.value?.favorite?.period}
                subTips={msg => msg.habit.common.focusAverage}
                subValue={periodFormatter(summary.value?.favorite?.average, { format: globalFilter.timeFormat })}
                containerStyle={GRID_CELL_STYLE}
            />
            <KanbanIndicatorCell
                mainName={t(msg => msg.habit.period.idle)}
                mainValue={summary.value?.longestIdle?.length}
                subTips={() => summary.value?.longestIdle?.period}
                containerStyle={GRID_CELL_STYLE}
            />
        </Flex>
    )
})

export default _default