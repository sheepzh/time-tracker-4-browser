/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import EditableTag, { type EditableTagProps } from "@app/components/common/EditableTag"
import { useShadow, useSwitch } from "@hooks"
import { EXCLUDING_PREFIX } from '@util/constant/remain-host'
import { judgeVirtualFast } from "@util/pattern"
import { computed, defineComponent } from "vue"
import WhiteInput from "./WhiteInput"

type Props = {
    white: string
    onChange: (white: string) => Promise<boolean>
    onDelete: (white: string) => void
}

function computeType(white: string): EditableTagProps['type'] {
    if (white.startsWith(EXCLUDING_PREFIX)) {
        return 'info'
    } else if (judgeVirtualFast(white)) {
        return 'warning'
    } else {
        return 'primary'
    }
}

const _default = defineComponent<Props>(props => {
    const [white, , resetWhite] = useShadow(() => props.white)
    const type = computed(() => computeType(white.value))
    const [editing, openEditing, closeEditing] = useSwitch()

    const handleCancel = () => {
        resetWhite()
        closeEditing()
    }

    return () => editing.value ? (
        <WhiteInput
            defaultValue={white.value}
            onSave={val => props.onChange?.(white.value = val)?.then(succ => succ && closeEditing())}
            onCancel={handleCancel}
        />
    ) : (
        <EditableTag
            text={white.value}
            onEdit={openEditing}
            onClose={() => white.value && props.onDelete(white.value)}
            type={type.value}
        />
    )
}, { props: ['white', 'onChange', 'onDelete'] })

export default _default