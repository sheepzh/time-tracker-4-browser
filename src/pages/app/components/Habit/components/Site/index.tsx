/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { GRID_CELL_STYLE, GRID_WRAPPER_STYLE } from "@app/components/common/grid"
import { KanbanCard } from "@app/components/common/kanban"
import { useXsState } from "@hooks"
import Flex from "@pages/components/Flex"
import { computed, defineComponent, type StyleValue } from "vue"
import { initProvider } from "./context"
import DailyTrend from "./DailyTrend"
import Distribution from "./Distribution"
import Summary from "./Summary"
import TopK from "./TopK"

const DISTRIBUTION_MIN_DAY_LENGTH = 15

const _default = defineComponent(() => {
    const dateRangeLength = initProvider()
    const isXs = useXsState()
    const topKStyle = computed(() => ({
        ...GRID_CELL_STYLE,
        height: isXs.value ? '200px' : undefined,
    } satisfies StyleValue))
    return () => (
        <KanbanCard title={msg => msg.habit.site.title}>
            <Flex gap={1} column={isXs.value} style={GRID_WRAPPER_STYLE}>
                <Summary />
                <Flex flex={isXs.value ? undefined : 4} style={topKStyle.value}>
                    <TopK />
                </Flex>
                {!isXs.value && (
                    <Flex flex={8} style={GRID_CELL_STYLE}>
                        {dateRangeLength.value >= DISTRIBUTION_MIN_DAY_LENGTH
                            ? <DailyTrend />
                            : <Distribution />
                        }
                    </Flex>
                )}
            </Flex>
        </KanbanCard >
    )
})

export default _default