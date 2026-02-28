/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { Delete, WarnTriangleFilled } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { EXCLUDING_PREFIX } from '@util/constant/remain-host'
import {
    ElDivider, ElIcon,
    ElLink,
    ElScrollbar, ElText,
    type ScrollbarInstance
} from "element-plus"
import { defineComponent, ref } from "vue"
import { useSopData, useUrlMiss } from "../context"
import SiteInput from './SiteInput'

const _default = defineComponent(() => {
    const data = useSopData()
    const urlMiss = useUrlMiss()
    const scrollbar = ref<ScrollbarInstance>()

    const handleAdd = (url: string) => {
        const urls = data.cond
        if (urls.includes(url)) return 'URL added already'
        urls.unshift(url)

        urlMiss.value = false
        scrollbar.value?.scrollTo(0)
    }

    const handleRemove = (idx: number) => data.cond.splice(idx, 1)

    return () => (
        <Flex column width="100%">
            <SiteInput onAdd={handleAdd} />
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
