/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listSiteStats } from '@api/sw/stat'
import { CategoryFilter } from '@app/components/common/filter'
import { GRID_CELL_STYLE, GRID_WRAPPER_STYLE } from '@app/components/common/grid'
import { KanbanCard } from "@app/components/common/kanban"
import { isOptionalIntArray } from '@app/util/types'
import { localReactive, useRequest, useXsState } from '@hooks'
import Flex from "@pages/components/Flex"
import { cvtDateRange2Str, getDayLength } from '@util/time'
import { createObjectGuard } from 'typescript-guard'
import { computed, defineComponent } from "vue"
import { useHabitFilter } from '../context'
import DailyTrend from "./DailyTrend"
import Distribution from "./Distribution"
import Summary from "./Summary"
import TopK from "./TopK"

const TREND_MIN_DAY = 15

type FilterOption = { cateIds?: number[] }
const isFilter = createObjectGuard<FilterOption>({ cateIds: isOptionalIntArray })

const _default = defineComponent<{}>(() => {
    const { dateRange } = useHabitFilter()
    const filter = localReactive<{ cateIds?: number[] }>('habit_site_filter', isFilter, {})
    const query = computed<tt4b.stat.SiteQuery>(() => ({
        date: cvtDateRange2Str(dateRange),
        cateIds: filter.cateIds,
    }))
    const dateLength = computed(() => getDayLength(dateRange[0], dateRange[1]))
    const { data: rows } = useRequest(
        () => listSiteStats(query.value),
        { deps: query, defaultValue: [] },
    )
    const { data: merged } = useRequest(
        () => listSiteStats({ ...query.value, mergeDate: true }),
        { deps: query, defaultValue: [] },
    )

    const isXs = useXsState()

    return () => (
        <KanbanCard title={msg => msg.habit.site.title} v-slots={{
            filter: () => <CategoryFilter modelValue={filter.cateIds} onChange={v => filter.cateIds = v} />,
            default: () => (
                <Flex gap={1} column={isXs.value} style={GRID_WRAPPER_STYLE}>
                    <Summary rows={rows.value} />
                    <Flex
                        flex={isXs.value ? undefined : 4}
                        style={{ height: isXs.value ? '200px' : undefined, ...GRID_CELL_STYLE }}
                    >
                        <TopK merged={merged.value} />
                    </Flex>
                    <Flex v-show={!isXs.value} flex={8} style={GRID_CELL_STYLE}>
                        {dateLength.value >= TREND_MIN_DAY
                            ? <DailyTrend rows={rows.value} />
                            : <Distribution merged={merged.value} />}
                    </Flex>
                </Flex>
            )
        }} />
    )
})

export default _default