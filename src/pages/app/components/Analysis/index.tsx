/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import RemoteFloat from '@app/Layout/RemoteFloat'
import { Flex } from '@pages/components'
import { ElScrollbar } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import ContentContainer, { FilterContainer } from '../common/ContentContainer'
import { TimeFormatFilter } from '../common/filter'
import Summary from "./components/Summary"
import TargetSelect from './components/TargetSelect'
import Trend from "./components/Trend"
import { initAnalysis } from "./context"

const _default = defineComponent(() => {
    const { loading, timeFormat: tf } = initAnalysis()

    return () => (
        <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
            <ContentContainer>
                <FilterContainer>
                    <Flex gap={10}>
                        <TargetSelect />
                        <TimeFormatFilter modelValue={tf.value} onChange={v => tf.value = v} />
                    </Flex>
                </FilterContainer>
                <Summary v-loading={loading.value} />
                <Trend v-loading={loading.value} />
            </ContentContainer>
            <RemoteFloat />
        </ElScrollbar>
    )
})

export default _default
