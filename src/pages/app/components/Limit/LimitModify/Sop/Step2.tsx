/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { Delete, WarnTriangleFilled } from "@element-plus/icons-vue"
import { useState } from "@hooks"
import Flex from "@pages/components/Flex"
import { EXCLUDING_PREFIX } from '@util/constant/remain-host'
import { cleanCond } from "@util/limit"
import {
    ElButton, ElDivider, ElIcon, ElInput, ElLink, ElMessage, ElScrollbar, ElText,
    type InputInstance, type ScrollbarInstance,
} from "element-plus"
import { type StyleValue, defineComponent, ref, watch } from "vue"
import { useSopData, useUrlMiss } from "./context"

const _default = defineComponent(() => {
    const data = useSopData()
    const urlMiss = useUrlMiss()
    const scrollbar = ref<ScrollbarInstance>()

    const inputEl = ref<InputInstance>()
    watch(urlMiss, v => v && inputEl.value?.focus())
    const warnAndFocus = (msg: string) => {
        ElMessage.warning(msg)
        inputEl.value?.focus()
    }

    const handleAdd = () => {
        let url: string | undefined = inputting.value?.trim?.()?.toLowerCase?.()
        if (!url) return warnAndFocus('URL is blank')
        url = cleanCond(url)
        if (!url) return warnAndFocus('URL is invalid')
        const urls = data.cond
        if (urls.includes(url)) return warnAndFocus('Duplicated URL')
        urls.unshift(url)

        urlMiss.value = false
        scrollbar.value?.scrollTo(0)

        clearInputting()
    }

    const handleRemove = (idx: number) => data.cond.splice(idx, 1)

    const [inputting, setInputting, clearInputting] = useState('')

    return () => (
        <Flex column width="100%">
            <Flex width="100%" column gap={5}>
                <ElInput
                    ref={inputEl}
                    modelValue={inputting.value}
                    onInput={setInputting}
                    clearable
                    onClear={clearInputting}
                    onKeydown={ev => (ev as KeyboardEvent)?.code === "Enter" && handleAdd()}
                    // change the color of append button
                    style={{ '--el-color-info': `var(--el-color-${urlMiss.value ? 'danger' : 'primary'}` }}
                    placeholder="www.demo.com, *.demo.com, demo.com/blog/*, demo.com/**, +www.demo.com/blog/list"
                    v-slots={{
                        append: () => <ElButton onClick={handleAdd}>{t(msg => msg.button.add)}</ElButton>
                    }}
                />
                <ElText style={{ textAlign: 'start', width: '100%', paddingInlineStart: '10px' } satisfies StyleValue}>
                    {t(msg => msg.limit.wildcardTip)}
                </ElText>
            </Flex>
            <ElDivider />
            <ElScrollbar maxHeight={320} ref={scrollbar}>
                <Flex column width="100%" gap={8}>
                    {data.cond?.map((url, idx) => (
                        <Flex
                            key={`${url}-${idx}`}
                            height={32}
                            align="center"
                            justify="space-between"
                            padding='0 20px'
                            style={{ backgroundColor: 'var(--el-fill-color)', borderRadius: 'var(--el-border-radius-large)' }}
                        >
                            <ElText type={url.startsWith(EXCLUDING_PREFIX) ? 'info' : 'primary'}>{url}</ElText>
                            <ElLink icon={Delete} type="danger" onClick={() => handleRemove(idx)} />
                        </Flex>
                    ))}
                </Flex>
                <Flex v-show={!data.cond?.length} width="100%" justify="center" gap={10} align="center">
                    <ElIcon color="var(--el-color-danger)" size={24}>
                        <WarnTriangleFilled />
                    </ElIcon>
                    <ElText>
                        {t(msg => msg.limit.message.noUrl)}
                    </ElText>
                </Flex>
            </ElScrollbar>
        </Flex>
    )
})

export default _default
