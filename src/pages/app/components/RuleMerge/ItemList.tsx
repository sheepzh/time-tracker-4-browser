/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { addMergeRule, deleteMergeRule, listAllMergeRules } from "@api/sw/merge"
import { t } from '@app/locale'
import { useManualRequest, useRequest } from '@hooks'
import Flex from "@pages/components/Flex"
import { ElMessage, ElMessageBox } from "element-plus"
import { defineComponent, ref } from "vue"
import AddButton from './components/AddButton'
import Item, { type ItemInstance } from './components/Item'

const _default = defineComponent(() => {
    const { data: items, refresh } = useRequest(listAllMergeRules, { defaultValue: [] })
    const handleSucc = () => {
        ElMessage.success(t(msg => msg.operation.successMsg))
        refresh()
    }
    const { refreshAsync: remove } = useManualRequest(deleteMergeRule, { onSuccess: handleSucc })
    const { refresh: update } = useManualRequest(async (origin: string, merged: string | number) => {
        await deleteMergeRule(origin)
        await addMergeRule({ origin, merged })
    }, { onSuccess: handleSucc })

    const itemRefs = ref<ItemInstance[]>([])

    const handleDelete = (origin: string) => {
        const message = t(msg => msg.mergeRule.removeConfirmMsg, { origin })
        const title = t(msg => msg.operation.confirmTitle)
        ElMessageBox.confirm(message, title).then(() => remove(origin))
    }

    async function handleChange(origin: string, merged: string | number, index: number): Promise<void> {
        const hasDuplicate = items.value.some((o, i) => o.origin === origin && i !== index)
        if (hasDuplicate) {
            ElMessage.warning(t(msg => msg.mergeRule.duplicateMsg, { origin }))
            itemRefs.value?.[index]?.forceEdit?.()
            return
        }
        update(origin, merged)
    }

    const { refresh: add } = useManualRequest(
        (rule: timer.merge.Rule) => addMergeRule(rule),
        { onSuccess: handleSucc }
    )

    const handleAdd = async (origin: string, merged: string | number): Promise<boolean> => {
        const alreadyExist = items.value.some(item => item.origin === origin)
        if (alreadyExist) {
            ElMessage.warning(t(msg => msg.mergeRule.duplicateMsg, { origin }))
            return false
        }
        const title = t(msg => msg.operation.confirmTitle)
        const content = t(msg => msg.mergeRule.addConfirmMsg, { origin })
        try {
            await ElMessageBox.confirm(content, title, { dangerouslyUseHTMLString: true })
            add({ origin, merged })
            return true
        } catch {
            return false
        }
    }

    return () => (
        <Flex gap={10} wrap justify="space-between">
            {items.value.map((item, idx) =>
                <Item
                    ref={() => itemRefs.value[idx]}
                    origin={item.origin}
                    merged={item.merged}
                    onDelete={handleDelete}
                    onChange={(origin, merged) => handleChange(origin, merged, idx)}
                />
            )}
            <AddButton onSave={handleAdd} />
        </Flex>
    )
})

export default _default