/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useAnalysisTimeFormat } from "@app/components/Analysis/context"
import { TimeFormatFilter } from '@app/components/common/filter'
import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import TargetSelect from "./TargetSelect"

const AnalysisFilter = defineComponent(() => {
    const timeFormat = useAnalysisTimeFormat()

    return () => (
        <Flex gap={10}>
            <TargetSelect />
            <TimeFormatFilter
                modelValue={timeFormat.value}
                onChange={val => timeFormat.value = val}
            />
        </Flex>
    )
})

export default AnalysisFilter