/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { ElScrollbar } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import ContentContainer, { FilterContainer } from '../common/ContentContainer'
import HabitFilter from "./components/HabitFilter"
import Period from "./components/Period"
import Site from "./components/Site"
import { initHabit } from "./components/context"

const _default = defineComponent(() => {
    initHabit()

    return () => (
        <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
            <ContentContainer>
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
