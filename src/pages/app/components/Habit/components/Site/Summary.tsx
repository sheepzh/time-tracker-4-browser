import { GRID_CELL_STYLE } from "@app/components/common/grid"
import { KanbanIndicatorCell } from "@app/components/common/kanban"
import { t } from "@app/locale"
import { periodFormatter } from "@app/util/time"
import { useXsState } from "@hooks"
import Flex from "@pages/components/Flex"
import { sum } from "@util/array"
import { getHost } from "@util/stat"
import { computed, defineComponent } from "vue"
import { FilterOption, useHabitFilter } from "../context"
import { computeAverageLen } from "./common"
import { useRows } from "./context"

type Result = {
    focus: {
        total: number
        average: number
    }
    count: {
        site: number
        time: number
        siteAverage: number
    }
    exclusiveToday4Average: boolean
}

const computeSummary = (rows: timer.stat.Row[] = [], filter: FilterOption): Result => {
    const [averageLen, exclusiveToday4Average, exclusiveDate] = computeAverageLen(filter?.dateRange)
    const totalFocus = sum(rows.map(r => r.focus))
    const totalFocus4Average = exclusiveDate ? sum(rows.filter(r => r.date !== exclusiveDate).map(r => r.focus)) : totalFocus
    const totalTime = sum(rows.map(r => r.time))
    const totalSite = new Set(rows.map(getHost)).size
    const totalSite4Average = exclusiveDate ? rows.filter(r => r.date !== exclusiveDate).length : rows.length

    return {
        focus: {
            total: totalFocus,
            average: averageLen ? totalFocus4Average / averageLen : 0,
        },
        count: {
            time: totalTime,
            site: totalSite,
            siteAverage: averageLen ? totalSite4Average / averageLen : 0,
        },
        exclusiveToday4Average,
    }
}

const computeCountText = (count: Result['count']): string => {
    const { time, site } = count || {}
    return [time ? `${time}` : '-', site ? `${site}` : '-'].join(" / ")
}

const _default = defineComponent(() => {
    const filter = useHabitFilter()
    const rows = useRows()
    const summary = computed(() => computeSummary(rows.value, filter))
    const isXs = useXsState()

    return () => (
        <Flex
            flex={isXs.value ? undefined : 4}
            column gap={1}
        >
            <KanbanIndicatorCell
                mainName={t(msg => msg.analysis.common.focusTotal)}
                mainValue={periodFormatter(summary.value?.focus?.total, { format: filter.timeFormat })}
                subTips={msg => msg.habit.common.focusAverage}
                subValue={periodFormatter(summary.value?.focus?.average, { format: filter.timeFormat })}
                subInfo={summary.value?.exclusiveToday4Average ? t(msg => msg.habit.site.exclusiveToday) : undefined}
                containerStyle={GRID_CELL_STYLE}
            />
            <KanbanIndicatorCell
                mainName={t(msg => msg.habit.site.countTotal)}
                mainValue={computeCountText(summary.value?.count)}
                subTips={msg => msg.habit.site.siteAverage}
                subValue={summary.value?.count?.siteAverage?.toFixed(0) || '-'}
                subInfo={summary.value?.exclusiveToday4Average ? t(msg => msg.habit.site.exclusiveToday) : undefined}
                containerStyle={GRID_CELL_STYLE}
            />
        </Flex>
    )
})

export default _default