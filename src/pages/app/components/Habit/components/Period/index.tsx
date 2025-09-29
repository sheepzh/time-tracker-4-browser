/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { GRID_CELL_STYLE } from "@app/components/common/grid"
import { KanbanCard } from "@app/components/common/kanban"
import { t } from "@app/locale"
import { useXsState } from "@hooks"
import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import Average from "./Average"
import { initProvider } from "./context"
import Filter from "./Filter"
import Stack from "./Stack"
import Summary from "./Summary"
import Trend from "./Trend"

const _default = defineComponent(() => {
    const filter = initProvider()
    const isXs = useXsState()

    return () => (
        <KanbanCard
            title={t(msg => msg.habit.period.title)}
            v-slots={{ filter: () => <Filter /> }}
        >
            <Flex
                gap={1}
                column={isXs.value}
                style={{ backgroundColor: 'var(--el-border-color)' }}
            >
                <Summary />
                <Flex
                    flex={isXs.value ? undefined : 3}
                    style={{
                        height: isXs.value ? '200px' : undefined,
                        ...GRID_CELL_STYLE,
                    }}
                >
                    {filter.chartType === 'average' && <Average />}
                    {filter.chartType === 'trend' && <Trend />}
                    {filter.chartType === 'stack' && <Stack />}
                </Flex>
            </Flex>
        </KanbanCard>
    )
})

export default _default