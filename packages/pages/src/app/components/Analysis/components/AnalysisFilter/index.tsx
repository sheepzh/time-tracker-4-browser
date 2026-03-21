/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import TimeFormatFilterItem from "@app/components/filter/TimeFormatFilterItem"
import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import { useAnalysisTimeFormat } from "../../context"
import TargetSelect from "./TargetSelect"

const AnalysisFilter = defineComponent(() => {
    const timeFormat = useAnalysisTimeFormat()

    return () => (
        <Flex gap={10}>
            <TargetSelect />
            <TimeFormatFilterItem
                modelValue={timeFormat.value}
                onChange={val => timeFormat.value = val}
            />
        </Flex>
    )
})

export default AnalysisFilter