/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import Flex from "@pages/components/Flex"
import { ElSwitch, ElText } from "element-plus"
import { defineComponent } from "vue"
import { ALL_BASE_FILTER_PROPS, type BaseFilterProps, useFilterState } from './common'

type Props = BaseFilterProps<boolean> & {
    label: string
}

const _default = defineComponent<Props>(props => {
    const [data, setter] = useFilterState('switch', props)

    return () => (
        <Flex gap={5} align="center">
            <ElText tag="b" type="info">{props.label}</ElText>
            <ElSwitch modelValue={data.value} onChange={val => setter(val as boolean)} />
        </Flex>
    )
}, { props: [...ALL_BASE_FILTER_PROPS, 'label'] })

export default _default