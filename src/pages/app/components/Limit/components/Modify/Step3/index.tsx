/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useDialogSop } from '@app/components/common/DialogSop/context'
import type { ModifyForm } from '@app/components/Limit/types'
import { t } from '@app/locale'
import { useXsState } from '@hooks'
import Flex from "@pages/components/Flex"
import { ElForm, ElFormItem, ElInputNumber } from "element-plus"
import { defineComponent } from "vue"
import PeriodInput from "./PeriodInput"
import TimeInput from "./TimeInput"

const MAX_HOUR_WEEKLY = 7 * 24

const _default = defineComponent(() => {
    const { form: data } = useDialogSop<ModifyForm>()
    const isXs = useXsState()

    return () => (
        <Flex justify="center">
            <ElForm labelWidth={150} labelPosition='left'>
                <ElFormItem label={t(msg => msg.limit.item.daily)}>
                    <Flex gap={10} column={isXs.value}>
                        <TimeInput modelValue={data.time ?? 0} onChange={v => data.time = v} />
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
                        <TimeInput modelValue={data.weekly ?? 0} onChange={v => data.weekly = v} hourMax={MAX_HOUR_WEEKLY} />
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
                    <TimeInput modelValue={data.visitTime ?? 0} onChange={v => data.visitTime = v} />
                </ElFormItem>
                <ElFormItem label={t(msg => msg.limit.item.period)}>
                    <PeriodInput modelValue={data.periods ?? []} onChange={v => data.periods = v} />
                </ElFormItem>
            </ElForm>
        </Flex>
    )
})

export default _default