/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import EditableTag from "@app/components/common/EditableTag"
import { t } from '@app/locale'
import { useShadow, useSwitch } from '@hooks'
import Flex from "@pages/components/Flex"
import { LOCAL_HOST_PATTERN } from "@util/constant/remain-host"
import { type TagProps } from "element-plus"
import { computed, defineComponent } from "vue"
import ItemInput from "./ItemInput"

type Props = {
    origin: string
    merged: string | number
    onChange?: (origin: string, merged: string | number) => void
    onDelete?: (origin: string) => void
}

export type ItemInstance = {
    forceEdit(): void
}

function computeMergeTxt(mergedVal: number | string,): string {
    if (typeof mergedVal === 'number') {
        return t(msg => msg.mergeRule.tagResult.level, { level: mergedVal + 1 })
    }
    if (!mergedVal) return t(msg => msg.mergeRule.tagResult.blank)
    return mergedVal
}

function computeMergeType(mergedVal: number | string): TagProps["type"] | undefined {
    if (typeof mergedVal === 'number') return 'success'
    if (!mergedVal) return 'info'
    return undefined
}

const _default = defineComponent<Props>((props, ctx) => {
    const [origin, , refreshOrigin] = useShadow(() => props.origin)
    const [merged, , refreshMerged] = useShadow(() => props.merged, '')

    const [editing, openEditing, closeEditing] = useSwitch()
    const type = computed(() => computeMergeType(merged.value))
    const mergeText = computed(() => computeMergeTxt(merged.value))

    ctx.expose({ forceEdit: openEditing } satisfies ItemInstance)

    const handleSave = (newOrigin: string, newMerged: string | number) => {
        closeEditing()
        props.onChange?.(newOrigin, newMerged)
    }

    const handleCancel = () => {
        refreshOrigin()
        refreshMerged()
        closeEditing()
    }

    return () => editing.value ? (
        <ItemInput
            origin={origin.value}
            merged={merged.value}
            onSave={handleSave}
            onCancel={handleCancel}
        />
    ) : (
        <EditableTag
            type={type.value}
            closable={LOCAL_HOST_PATTERN !== origin.value}
            onClose={() => props.onDelete?.(props.origin)}
            onEdit={openEditing}
        >
            <Flex gap={4}>
                <span dir="ltr">{origin.value}</span>
                <span>{'>>>'}</span>
                <span>{mergeText.value}</span>
            </Flex>
        </EditableTag>
    )
}, { props: ['merged', 'onChange', 'onDelete', 'origin'] })

export default _default