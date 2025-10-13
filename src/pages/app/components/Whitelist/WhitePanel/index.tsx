/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import whitelistService from "@service/whitelist/service"
import { ElMessage, ElMessageBox } from "element-plus"
import { defineComponent, onBeforeMount, reactive } from "vue"
import AddButton from './AddButton'
import WhiteItem from './WhiteItem'

const _default = defineComponent(() => {
    const whitelist = reactive<string[]>([])
    onBeforeMount(() => whitelistService.listAll().then(l => whitelist.push(...l)))

    const handleChanged = async (val: string, index: number): Promise<boolean> => {
        const duplicate = whitelist.find((white, i) => white === val && i !== index)
        if (duplicate) {
            ElMessage.warning(t(msg => msg.whitelist.duplicateMsg))
            // Reopen
            return false
        }
        await whitelistService.remove(whitelist[index])
        await whitelistService.add(val)
        whitelist[index] = val
        ElMessage.success(t(msg => msg.operation.successMsg))
        return true
    }

    const handleAdd = async (val: string): Promise<boolean> => {
        const exists = whitelist.some(item => item === val)
        if (exists) {
            ElMessage.warning(t(msg => msg.whitelist.duplicateMsg))
            return false
        }

        const msg = t(msg => msg.whitelist.addConfirmMsg, { url: val })
        const title = t(msg => msg.operation.confirmTitle)
        return ElMessageBox.confirm(msg, title, { dangerouslyUseHTMLString: true })
            .then(async () => {
                await whitelistService.add(val)
                whitelist.push(val)
                ElMessage.success(t(msg => msg.operation.successMsg))
                return true
            })
            .catch(() => false)
    }

    const handleClose = (whiteItem: string) => {
        const confirmMsg = t(msg => msg.whitelist.removeConfirmMsg, { url: whiteItem })
        const confirmTitle = t(msg => msg.operation.confirmTitle)
        ElMessageBox
            .confirm(confirmMsg, confirmTitle, { dangerouslyUseHTMLString: true })
            .then(() => whitelistService.remove(whiteItem))
            .then(() => {
                ElMessage.success(t(msg => msg.operation.successMsg))
                const index = whitelist.indexOf(whiteItem)
                index !== -1 && whitelist.splice(index, 1)
            })
            .catch(() => { })
    }

    return () => (
        <Flex gap={10} wrap justify="space-between">
            {whitelist.map((white, index) => (
                <WhiteItem
                    white={white}
                    onChange={val => handleChanged(val, index)}
                    onDelete={handleClose}
                />
            ))}
            <AddButton onSave={handleAdd} />
        </Flex>
    )
})

export default _default