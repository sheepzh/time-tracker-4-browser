/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { useSwitch, useXsState } from "@hooks"
import limitService from "@service/limit-service"
import { ElDialog, ElMessage } from "element-plus"
import { computed, defineComponent, nextTick, ref, toRaw } from "vue"
import { type ModifyInstance, useLimitTable } from "../../context"
import Sop, { type SopInstance } from "./Sop"

type Mode = "create" | "modify"

const _default = defineComponent((_, ctx) => {
    const { refresh } = useLimitTable()
    const [visible, open, close] = useSwitch()
    const sop = ref<SopInstance>()
    const mode = ref<Mode>()
    const title = computed(() => mode.value === "create" ? t(msg => msg.button.create) : t(msg => msg.button.modify))
    // Cache
    let modifyingItem: timer.limit.Rule | undefined = undefined

    const handleSave = async (rule: MakeOptional<timer.limit.Rule, "id">) => {
        if (!rule) return
        const { cond, enabled, name, time, weekly, visitTime, periods, weekdays, count, weeklyCount } = rule
        let saved: timer.limit.Rule
        if (mode.value === 'modify') {
            if (!modifyingItem) return
            saved = {
                ...modifyingItem,
                cond, enabled, name, time, weekly, visitTime, weekdays, count, weeklyCount,
                // Object to array
                periods: periods?.map(i => ([i?.[0], i?.[1]] satisfies Vector<number>)),
            } satisfies timer.limit.Rule
            await limitService.update(saved)
        } else {
            const toCreate = {
                cond, enabled, name, time, weekly, visitTime, weekdays, count, weeklyCount,
                // Object to array
                periods: periods?.map(i => ([i?.[0], i?.[1]] satisfies Vector<number>)),
                allowDelay: false, locked: false,
            } satisfies MakeOptional<timer.limit.Rule, 'id'>
            const id = await limitService.create(toCreate)
            saved = { ...toCreate, id }
        }
        close()
        ElMessage.success(t(msg => msg.operation.successMsg))
        sop.value?.reset?.()
        refresh?.()
    }

    ctx.expose({
        create() {
            open()
            mode.value = 'create'
            modifyingItem = undefined
            nextTick(() => sop.value?.reset())
        },
        modify(row: timer.limit.Item) {
            open()
            mode.value = 'modify'
            modifyingItem = { ...row }
            nextTick(() => sop.value?.reset?.(toRaw(row)))
        },
    } satisfies ModifyInstance)

    const isXs = useXsState()

    return () => (
        <ElDialog
            title={title.value}
            modelValue={visible.value}
            closeOnClickModal={false}
            fullscreen={isXs.value}
            width={isXs.value ? '100%' : 800}
            onClose={close}
        >
            <Sop ref={sop} onSave={handleSave} onCancel={close} />
        </ElDialog>
    )
})

export default _default