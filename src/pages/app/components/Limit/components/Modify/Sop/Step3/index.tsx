/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { useXsState } from '@hooks/useMediaSize'
import Flex from "@pages/components/Flex"
import { ElForm, ElFormItem, ElInputNumber } from "element-plus"
import { defineComponent } from "vue"
import { useSopData } from "../context"
import PeriodInput from "./PeriodInput"
import TimeInput from "./TimeInput"

const MAX_HOUR_WEEKLY = 7 * 24

const _default = defineComponent(() => {
    const data = useSopData()
    const isXs = useXsState()

    return () => (
        <Flex justify="center">
            <ElForm labelWidth={150} labelPosition='left'>
                <ElFormItem label={t(msg => msg.limit.item.daily)}>
                    <Flex gap={10} column={isXs.value}>
                        <TimeInput modelValue={data.time} onChange={v => data.time = v} />
                        {!isXs.value && t(msg => msg.limit.item.or)}
                        <ElInputNumber
                            min={0}
                            step={10}
                            modelValue={data.count}
                            onChange={v => data.count = v ?? 0}
                            size={isXs.value ? 'small' : undefined}
                            v-slots={{ suffix: () => t(msg => msg.limit.item.visits) }}
                        />
                    </Flex>
                </ElFormItem>
                <ElFormItem label={t(msg => msg.limit.item.weekly)}>
                    <Flex gap={10} column={isXs.value}>
                        <TimeInput modelValue={data.weekly} onChange={v => data.weekly = v} hourMax={MAX_HOUR_WEEKLY} />
                        {!isXs.value && t(msg => msg.limit.item.or)}
                        <ElInputNumber
                            min={0}
                            step={10}
                            modelValue={data.weeklyCount}
                            onChange={v => data.weeklyCount = v ?? 0}
                            size={isXs.value ? 'small' : undefined}
                            v-slots={{ suffix: () => t(msg => msg.limit.item.visits) }}
                        />
                    </Flex>
                </ElFormItem>
                <ElFormItem label={t(msg => msg.limit.item.visitTime)}>
                    <TimeInput modelValue={data.visitTime} onChange={v => data.visitTime = v} />
                </ElFormItem>
                <ElFormItem label={t(msg => msg.limit.item.period)}>
                    <PeriodInput modelValue={data.periods} onChange={v => data.periods = v} />
                </ElFormItem>
            </ElForm>
        </Flex>
    )
})

export default _default