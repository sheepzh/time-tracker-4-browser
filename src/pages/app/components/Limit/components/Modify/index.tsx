/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { addLimit, updateLimits } from '@api/sw/limit'
import DialogSop from '@app/components/common/DialogSop'
import { initDialogSopContext } from '@app/components/common/DialogSop/context'
import { cleanCond } from '@app/components/Limit/common'
import { useLimitData } from "@app/components/Limit/context"
import type { ModifyForm, ModifyInstance } from '@app/components/Limit/types'
import { t } from '@app/locale'
import { range } from '@util/array'
import { computed, defineComponent, ref, toRaw } from "vue"
import Step1 from './Step1'
import Step2 from './Step2'
import Step3 from './Step3'

type Mode = "create" | "modify"

const STEP_TITLES = [
    t(msg => msg.limit.step.base),
    t(msg => msg.limit.step.url),
    t(msg => msg.limit.step.rule),
]

const createInitial = (url?: string): ModifyForm => ({
    name: `RULE-${new String(new Date().getTime() % 10000).padStart(4, '0')}`,
    time: 3600,
    weekly: 0,
    cond: url ? [cleanCond(url)] : [],
    visitTime: 0,
    periods: [],
    enabled: true,
    weekdays: range(7),
    count: 0,
    weeklyCount: 0,
    allowDelay: false,
    locked: false,
})

const _default = defineComponent((_, ctx) => {
    const { refresh } = useLimitData()
    const mode = ref<Mode>()
    const title = computed(() => mode.value === "create" ? t(msg => msg.button.create) : t(msg => msg.button.modify))

    const { step, open } = initDialogSopContext<ModifyForm>({
        stepCount: STEP_TITLES.length,
        init: createInitial,
        onNext: ({ form, current }) => {
            if (current === 0) {
                const nameVal = form.name?.trim?.()
                const weekdaysVal = form.weekdays
                if (!nameVal) {
                    throw new Error("Name is empty")
                } if (!weekdaysVal?.length) {
                    throw new Error("Effective days are empty")
                }
            } else if (current === 1) {
                if (!form.cond?.length) {
                    form.urlMiss = true
                    throw new Error(t(msg => msg.limit.message.noUrl))
                }
                form.urlMiss = false
            }
        },
        onFinish: async ({ form }) => {
            const { cond, enabled, name, time, count, weekly, weeklyCount, visitTime, periods, weekdays } = toRaw(form)
            if (true
                && !time && !count
                && !weekly && !weeklyCount
                && !visitTime && !periods?.length
            ) {
                throw new Error(t(msg => msg.limit.message.noRule))
            }
            let saved: timer.limit.Rule
            if (mode.value === 'modify') {
                if (!modifyingItem) return
                saved = {
                    ...modifyingItem,
                    cond, enabled, name, time, weekly, visitTime, weekdays, count, weeklyCount,
                    // Object to array
                    periods: periods?.map(i => ([i?.[0], i?.[1]] satisfies Vector<number>)),
                } satisfies timer.limit.Rule
                await updateLimits([saved])
            } else {
                const toCreate = {
                    cond, enabled, name, time, weekly, visitTime, weekdays, count, weeklyCount,
                    // Object to array
                    periods: periods?.map(i => ([i?.[0], i?.[1]] satisfies Vector<number>)),
                    allowDelay: false, locked: false,
                } satisfies MakeOptional<timer.limit.Rule, 'id'>
                const id = await addLimit(toCreate)
                saved = { ...toCreate, id }
            }
            refresh?.()
        }
    })
    // Cache
    let modifyingItem: timer.limit.Rule | undefined = undefined

    ctx.expose({
        create(url?: string) {
            open(createInitial(url))
            mode.value = 'create'
            modifyingItem = undefined
        },
        modify(row: timer.limit.Item) {
            open(toRaw(row))
            mode.value = 'modify'
            modifyingItem = { ...row }
        },
    } satisfies ModifyInstance)


    return () => (
        <DialogSop title={title.value} stepTitles={STEP_TITLES}>
            <Step1 v-show={step.value === 0} />
            <Step2 v-show={step.value === 1} />
            <Step3 v-show={step.value === 2} />
        </DialogSop>

    )
})

export default _default