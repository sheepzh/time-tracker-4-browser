/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { ElScrollbar } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import ContentContainer, { FilterContainer } from "../ContentContainer"
import AnalysisFilter from "./components/AnalysisFilter"
import Summary from "./components/Summary"
import Trend from "./components/Trend"
import { initAnalysis } from "./context"

const _default = defineComponent(() => {
    const { loading } = initAnalysis()

    return () => (
        <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
            <ContentContainer>
                <FilterContainer>
                    <AnalysisFilter />
                </FilterContainer>
                <Summary v-loading={loading.value} />
                <Trend v-loading={loading.value} />
            </ContentContainer>
        </ElScrollbar>
    )
})

export default _default
