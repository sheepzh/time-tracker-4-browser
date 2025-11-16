/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { useDebounce, useRequest, useState, useSwitch } from "@hooks"
import Flex from '@pages/components/Flex'
import limitService from "@service/limit-service"
import { ElDialog, ElInput } from "element-plus"
import { defineComponent } from "vue"
import AlertLines, { type AlertLinesProps } from '../common/AlertLines'
import { type TestInstance } from "./context"

async function fetchResult(url: string | undefined): Promise<AlertLinesProps> {
    if (!url) {
        return { type: 'warning', title: msg => msg.limit.message.inputTestUrl }
    }
    const matched = await limitService.select({ url, filterDisabled: true })
    if (!matched?.length) {
        return { type: 'info', title: msg => msg.limit.message.noRuleMatched }
    } else {
        return {
            type: 'success',
            title: msg => msg.limit.message.rulesMatched,
            lines: matched.map(m => m.name)
        }
    }
}

const _default = defineComponent((_props, ctx) => {
    const [url, setUrl, clearUrl] = useState<string>()
    const debouncedUrl = useDebounce(url)
    const [visible, open, close] = useSwitch()
    const { data: result } = useRequest(() => fetchResult(debouncedUrl.value), { deps: debouncedUrl })

    ctx.expose({
        show: () => {
            clearUrl()
            open()
        }
    } satisfies TestInstance)

    return () => (
        <ElDialog
            title={t(msg => msg.limit.button.test)}
            modelValue={visible.value}
            closeOnClickModal={false}
            onClose={close}
        >
            <Flex gap={18} column>
                <ElInput
                    modelValue={url.value} onInput={setUrl}
                    clearable onClear={clearUrl}
                    placeholder='e.g. https://www.github.com/sheepzh/time-tracker-4-browser'
                />
                {result.value && <AlertLines {...result.value} />}
            </Flex>
        </ElDialog>
    )
})

export default _default