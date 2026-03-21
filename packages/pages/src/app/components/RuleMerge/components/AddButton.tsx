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
import ItemInput from './ItemInput'

type Props = {
    onSave: (origin: string, merged: string | number) => Promise<boolean>
}

const _default = defineComponent<Props>(props => {
    const [editing, startEdit, closeEdit] = useSwitch()
    const [origin, setOrigin, resetOrigin] = useState('')
    const [merged, setMerged, resetMerged] = useState<string | number>('')
    const handleEdit = () => {
        resetOrigin()
        resetMerged()
        startEdit()
    }

    const handleSave = (newOrigin: string, newMerged: string | number) => {
        setMerged(newMerged)
        setOrigin(newOrigin)
        props.onSave(newOrigin, newMerged).then(succ => succ && closeEdit())
    }

    return () => editing.value ? (
        <ItemInput
            origin={origin.value}
            merged={merged.value}
            onSave={handleSave}
            onCancel={closeEdit}
            end
        />
    ) : (
        <ElButton onClick={handleEdit} style={{ marginInlineEnd: 'auto' } satisfies StyleValue}>
            {`+ ${t(msg => msg.button.create)}`}
        </ElButton>
    )
}, { props: ['onSave'] })

export default _default