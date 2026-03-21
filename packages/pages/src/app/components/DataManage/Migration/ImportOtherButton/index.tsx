/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { Upload } from "@element-plus/icons-vue"
import { useSwitch } from "@hooks"
import { ElButton, ElDialog } from "element-plus"
import { defineComponent } from "vue"
import { useDataMemory } from "../../context"
import Sop from "./Sop"

const _default = defineComponent(() => {
    const { refreshMemory } = useDataMemory()
    const [visible, open, close] = useSwitch()
    const handleImported = () => {
        close()
        refreshMemory?.()
    }

    return () => <>
        <ElButton
            size="large"
            type="warning"
            icon={Upload}
            onClick={open}
            style={{ margin: 0, flex: 1, width: '100%', textWrap: 'wrap', lineHeight: '1.4em' }}
        >
            {t(msg => msg.item.operation.importOtherData)}
        </ElButton>
        <ElDialog
            top="10vh"
            modelValue={visible.value}
            title={t(msg => msg.item.operation.importOtherData)}
            width="80%"
            closeOnClickModal={false}
            onClose={close}
        >
            <Sop onCancel={close} onImport={handleImported} />
        </ElDialog>
    </>
})

export default _default