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
import TimeInput from '@pages/components/TimeInput'
import { ElForm, ElFormItem, ElInputNumber } from "element-plus"
import { defineComponent } from "vue"
import PeriodInput from "./PeriodInput"

const MAX_HOUR_WEEKLY = 7 * 24
const UNLIMITED = t(msg => msg.shared.limit.unlimited)

const _default = defineComponent(() => {
    const { form: data } = useDialogSop<ModifyForm>()
    const isXs = useXsState()

    return () => (
        <Flex justify="center">
            <ElForm labelWidth={150} labelPosition='left'>
                <ElFormItem label={t(msg => msg.shared.limit.daily)}>
                    <Flex gap={10} column={isXs.value}>
                        <TimeInput placeholder={UNLIMITED} modelValue={data.time} onChange={v => data.time = v} />
                        {!isXs.value && t(msg => msg.limit.item.or)}
                        <ElInputNumber
                            min={0}
                            step={10}
                            modelValue={data.count}
                            onChange={v => data.count = v ?? 0}
                            size={isXs.value ? 'small' : undefined}
                            v-slots={{ suffix: () => t(msg => msg.shared.limit.visits, { n: '' }).trim() }}
                        />
                    </Flex>
                </ElFormItem>
                <ElFormItem label={t(msg => msg.shared.limit.weekly)}>
                    <Flex gap={10} column={isXs.value}>
                        <TimeInput
                            placeholder={UNLIMITED}
                            modelValue={data.weekly}
                            onChange={v => data.weekly = v}
                            hourMax={MAX_HOUR_WEEKLY}
                        />
                        {!isXs.value && t(msg => msg.limit.item.or)}
                        <ElInputNumber
                            min={0}
                            step={10}
                            modelValue={data.weeklyCount}
                            onChange={v => data.weeklyCount = v ?? 0}
                            size={isXs.value ? 'small' : undefined}
                            v-slots={{ suffix: () => t(msg => msg.shared.limit.visits, { n: '' }).trim() }}
                        />
                    </Flex>
                </ElFormItem>
                <ElFormItem label={t(msg => msg.limit.item.visitTime)}>
                    <TimeInput
                        placeholder={UNLIMITED}
                        modelValue={data.visitTime}
                        onChange={v => data.visitTime = v}
                    />
                </ElFormItem>
                <ElFormItem label={t(msg => msg.shared.limit.period)}>
                    <PeriodInput modelValue={data.periods ?? []} onChange={v => data.periods = v} />
                </ElFormItem>
            </ElForm>
        </Flex>
    )
})

export default _default