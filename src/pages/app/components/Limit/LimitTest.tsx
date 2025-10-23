/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { useState, useSwitch } from "@hooks"
import { selectLimitItems } from "@service/limit-service"
import { ElButton, ElDialog, ElFormItem, ElInput } from "element-plus"
import { computed, defineComponent } from "vue"
import AlertLines, { type AlertLinesProps } from '../common/AlertLines'
import { type TestInstance } from "./context"

function computeResult(url: string | undefined, inputting: boolean, matched: timer.limit.Rule[]): AlertLinesProps {
    if (!url) {
        return { type: 'info', title: msg => msg.limit.message.inputTestUrl }
    }
    if (inputting) {
        const title = t(msg => msg.limit.message.clickTestButton, { buttonText: t(msg => msg.button.test) })
        return { type: 'info', title }
    }
    if (!matched?.length) {
        return { type: 'warning', title: msg => msg.limit.message.noRuleMatched }
    } else {
        return {
            type: 'success',
            title: msg => msg.limit.message.rulesMatched,
            lines: matched.map(m => m.name)
        }
    }
}

const _default = defineComponent((_props, ctx) => {
    const [url, , clearUrl] = useState<string>()
    const [matched, , clearMatched] = useState<timer.limit.Rule[]>([])
    const [visible, open, close] = useSwitch()
    const [urlInputting, startInput, endInput] = useSwitch(true)
    const result = computed(() => computeResult(url.value, urlInputting.value, matched.value))

    const changeInput = (newVal?: string) => {
        startInput()
        url.value = newVal?.trim()
    }

    const handleTest = async () => {
        endInput()
        matched.value = await selectLimitItems({ url: url.value, filterDisabled: true })
    }

    ctx.expose({
        show: () => {
            clearUrl()
            open()
            startInput()
            clearMatched()
        }
    } satisfies TestInstance)
    return () => (
        <ElDialog
            title={t(msg => msg.button.test)}
            modelValue={visible.value}
            closeOnClickModal={false}
            onClose={close}
        >
            <ElFormItem labelWidth={120} label={t(msg => msg.limit.button.test)}>
                <ElInput
                    modelValue={url.value}
                    clearable
                    onClear={() => changeInput()}
                    onKeydown={ev => (ev as KeyboardEvent).key === "Enter" && handleTest()}
                    onInput={changeInput}
                    v-slots={{
                        append: () => <ElButton onClick={handleTest}>{t(msg => msg.button.test)}</ElButton>
                    }}
                />
            </ElFormItem>
            <AlertLines {...result.value} />
        </ElDialog>
    )
})

export default _default