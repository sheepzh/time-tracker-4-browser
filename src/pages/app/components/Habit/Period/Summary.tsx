import { GRID_CELL_STYLE } from '@app/components/common/grid'
import { KanbanIndicatorCell } from '@app/components/common/kanban'
import { dateFmt, t } from '@app/locale'
import { periodFormatter } from '@app/util/time'
import { useXsState } from '@hooks'
import { Flex } from '@pages/components'
import { averageByDay } from "@util/period"
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

const computeSummary = (rows: tt4b.period.Row[], periodSize: number): Result => {
    const averaged = averageByDay(rows, periodSize)
    const fav = averaged.sort((b, a) => a.milliseconds - b.milliseconds)[0]
    const favFmt = dateFmt({ hour: '2-digit', minute: '2-digit' })
    const favPeriod = fav ? favFmt.formatRange(fav.startTime, fav.endTime) : '-'

    let maxIdle: [tt4b.period.Row | undefined, tt4b.period.Row | undefined, number] = [, , 0]

    let idleStart: tt4b.period.Row | undefined
    let idleEnd: tt4b.period.Row | undefined
    rows.forEach(r => {
        if (r.milliseconds) {
            if (!idleStart || !idleEnd) return
            const newEmptyTs = idleEnd.endTime - idleStart.endTime
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
        idleLength = periodFormatter(end.endTime - start.startTime, { format: 'hour' })
        idlePeriod = dateFmt({
            month: "2-digit", day: "2-digit",
            hour: "2-digit", hour12: false, minute: "2-digit", second: "2-digit",
        }).formatRange(start.startTime, end.endTime)
    }

    return {
        favorite: {
            period: favPeriod,
            average: fav?.milliseconds ?? 0,
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
    const summary = computed(() => computeSummary(data.value.curr, filter.periodSize))
    const isXs = useXsState()

    return () => (
        <Flex column gap={1} flex={isXs.value ? undefined : 1}>
            <KanbanIndicatorCell
                mainName={t(msg => msg.habit.period.busiest)}
                mainValue={summary.value.favorite.period}
                subTips={msg => msg.habit.common.focusAverage}
                subValue={periodFormatter(summary.value.favorite.average, { format: globalFilter.timeFormat })}
                containerStyle={GRID_CELL_STYLE}
            />
            <KanbanIndicatorCell
                mainName={t(msg => msg.habit.period.idle)}
                mainValue={summary.value.longestIdle.length}
                subTips={() => summary.value.longestIdle.period}
                containerStyle={GRID_CELL_STYLE}
            />
        </Flex>
    )
})

export default _default