/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import ContentContainer, { FilterContainer } from "@app/components/common/ContentContainer"
import { ElScrollbar } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import HabitFilter from "./components/HabitFilter"
import Period from "./components/Period"
import Site from "./components/Site"
import { initHabit } from "./components/context"

const _default = defineComponent(() => {
    initHabit()

    return () => (
        <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
            <ContentContainer >
                <FilterContainer>
                    <HabitFilter />
                </FilterContainer>
                <Site />
                <Period />
            </ContentContainer>
        </ElScrollbar>
    )

})

export default _default
