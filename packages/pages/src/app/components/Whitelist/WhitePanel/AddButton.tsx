/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { useState, useSwitch } from "@hooks"
import { ElButton } from "element-plus"
import { defineComponent, StyleValue } from "vue"
import WhiteInput from './WhiteInput'

type Props = {
    onSave: (white: string) => Promise<boolean | undefined>
}

const _default = defineComponent<Props>(({ onSave }) => {
    const [editing, openEdit, closeEdit] = useSwitch(false)
    const [white, _setWhite, resetWhite] = useState('')

    const handleAdd = () => {
        resetWhite()
        openEdit()
    }

    return () => editing.value ? (
        <WhiteInput
            defaultValue={white.value}
            onSave={val => onSave(white.value = val).then(succ => succ && closeEdit())}
            onCancel={closeEdit}
            end
        />
    ) : (
        <ElButton onClick={handleAdd} style={{ marginInlineEnd: 'auto' } satisfies StyleValue} >
            {`+ ${t(msg => msg.button.create)}`}
        </ElButton>
    )
}, { props: ['onSave'] })

export default _default