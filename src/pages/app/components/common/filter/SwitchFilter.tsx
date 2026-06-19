/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import Flex from "@pages/components/Flex"
import { ElSwitch, ElText } from "element-plus"
import type { FunctionalComponent } from "vue"

type Props = ModelValue<boolean> & {
    label: string
}

const SwitchFilter: FunctionalComponent<Props> = props => (
    <Flex gap={5} align="center">
        <ElText tag="b" type="info">{props.label}</ElText>
        <ElSwitch
            modelValue={props.modelValue}
            onChange={val => props.onChange?.(Boolean(val))}
        />
    </Flex>
)
SwitchFilter.displayName = 'SwitchFilter'

export default SwitchFilter