/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useDialogSop } from '@app/components/common/DialogSop/context'
import { t } from "@app/locale"
import { ElAlert } from "element-plus"
import { defineComponent, toRaw } from "vue"
import type { ClearForm } from './types'

const _default = defineComponent<{}>(props => {
    const { form } = useDialogSop<ClearForm>()
    return () => (
        <ElAlert type="success" closable={false}>
            {t(msg => msg.option.backup.clear.confirmTip, {
                ...toRaw(form.result),
                clientName: form.client?.name ?? ''
            })}
        </ElAlert>
    )
})

export default _default