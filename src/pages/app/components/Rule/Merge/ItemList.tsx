/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { addMergeRule, deleteMergeRule, listAllMergeRules } from "@api/sw/merge"
import { t } from '@app/locale'
import { useOperation, useRequest } from '@hooks'
import Flex from "@pages/components/Flex"
import { ElMessage, ElMessageBox } from "element-plus"
import { defineComponent, ref } from "vue"
import AddButton from './components/AddButton'
import Item, { type ItemInstance } from './components/Item'

const _default = defineComponent<{}>(() => {
    const { data: items, refresh } = useRequest(listAllMergeRules, { defaultValue: [] })

    const handleDelete = useOperation(async (origin: string) => {
        await ElMessageBox.confirm(t(msg => msg.rule.merge.removeConfirmMsg, { origin }))
        await deleteMergeRule(origin)
    }, { onSuccess: refresh })

    const handleChange = useOperation(async (origin: string, merged: string | number, index: number) => {
        const hasDuplicate = items.value.some((o, i) => o.origin === origin && i !== index)
        if (hasDuplicate) {
            ElMessage.warning(t(msg => msg.rule.merge.duplicateMsg, { origin }))
            itemRefs.value?.[index]?.forceEdit?.()
            return false
        }
        await deleteMergeRule(origin)
        await addMergeRule({ origin, merged })
    }, { onSuccess: refresh })

    const itemRefs = ref<ItemInstance[]>([])

    const add = useOperation(addMergeRule, { onSuccess: refresh })

    const handleAdd = async (origin: string, merged: string | number): Promise<boolean> => {
        const alreadyExist = items.value.some(item => item.origin === origin)
        if (alreadyExist) {
            ElMessage.warning(t(msg => msg.rule.merge.duplicateMsg, { origin }))
            return false
        }
        const content = t(msg => msg.rule.merge.addConfirmMsg, { origin })
        try {
            await ElMessageBox.confirm(content)
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