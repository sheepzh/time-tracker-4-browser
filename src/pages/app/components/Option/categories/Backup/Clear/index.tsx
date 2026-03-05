/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type SopInstance } from "@app/components/common/DialogSop"
import { t } from "@app/locale"
import { Delete } from "@element-plus/icons-vue"
import { useSwitch } from "@hooks"
import { ElButton, ElDialog } from "element-plus"
import { defineComponent, ref, type StyleValue } from "vue"
import Sop from "./Sop"

const _default = defineComponent(() => {
    const [dialogVisible, open, close] = useSwitch(false)
    const sop = ref<SopInstance>()

    return () => <>
        <ElButton
            type="danger"
            icon={Delete}
            onClick={open}
            style={{ marginInlineStart: 0 } satisfies StyleValue}
        >
            {t(msg => msg.option.backup.clear.btn)}
        </ElButton>
        <ElDialog
            title={t(msg => msg.option.backup.clear.btn)}
            modelValue={dialogVisible.value}
            onOpen={() => sop.value?.init?.()}
            onClose={close}
        >
            <Sop ref={sop} onCancel={close} onClear={close} />
        </ElDialog>
    </>
})

export default _default