/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { Check, Close } from "@element-plus/icons-vue"
import { useShadow } from "@hooks"
import Box from "@pages/components/Box"
import { LOCAL_HOST_PATTERN } from "@util/constant/remain-host"
import { tryParseInteger } from "@util/number"
import { isValidHost } from "@util/pattern"
import { ElButton, ElInput, ElMessage } from "element-plus"
import { computed, defineComponent, StyleValue } from "vue"

type Props = {
    origin: string
    merged: string | number
    end?: boolean
    onSave?: (origin: string, merged: string | number) => void
    onCancel?: () => void
}

const _default = defineComponent<Props>(props => {
    const [origin, setOrigin, resetOrigin] = useShadow(() => props.origin, '')
    const [merged, setMerged, resetMerged] = useShadow(() => props.merged, '')

    const mergedTxt = computed({
        get() {
            const mergedVal = merged.value
            if (typeof mergedVal === 'number') return `${mergedVal + 1}`
            else return mergedVal
        },
        set(val: string) {
            const newVal = tryParseInteger(val?.trim())[1]
            setMerged(typeof newVal === 'number' ? newVal - 1 : newVal)
        },
    })

    const handleSave = () => {
        const originVal = origin.value
        const mergedVal = merged.value
        if (originVal && mergedVal && isValidHost(originVal)) {
            props.onSave?.(originVal, mergedVal)
        } else {
            ElMessage.warning(t(msg => msg.mergeRule.errorOrigin))
        }
    }

    const handleCancel = () => {
        resetOrigin()
        resetMerged()
        props.onCancel?.()
    }

    return () => (
        <Box style={{ marginInlineEnd: props.end ? 'auto' : undefined }}>
            <ElInput
                modelValue={origin.value}
                placeholder={t(msg => msg.mergeRule.originPlaceholder)}
                clearable
                onClear={() => setOrigin('')}
                onInput={setOrigin}
                disabled={origin.value === LOCAL_HOST_PATTERN}
                style={{ width: '160px' } satisfies StyleValue}
            />
            <ElInput
                modelValue={mergedTxt.value}
                placeholder={t(msg => msg.mergeRule.mergedPlaceholder)}
                clearable
                onClear={() => mergedTxt.value = ''}
                onInput={val => mergedTxt.value = val}
                style={{ width: '140px' } satisfies StyleValue}
            />
            <ElButton icon={Close} onClick={handleCancel} />
            <ElButton icon={Check} onClick={handleSave} style={{ marginInlineStart: '0px' } satisfies StyleValue} />
        </Box>
    )
}, { props: ['end', 'merged', 'onCancel', 'onSave', 'origin'] })

export default _default