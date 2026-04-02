/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { checkAuth, getLastBackUp, syncData } from "@api/sw/backup"
import { t } from '@app/locale'
import { Operation, UploadFilled } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useManualRequest, useRequest, useState } from "@hooks"
import Flex from "@pages/components/Flex"
import { formatTime } from "@util/time"
import { ElButton, ElDivider, ElLoading, ElMessage, ElText, useNamespace } from "element-plus"
import { defineComponent, type StyleValue } from "vue"
import Clear from "./Clear"
import Download from "./Download"

const useStyle = () => {
    const buttonNs = useNamespace('button')
    return css`
        .${buttonNs.b()}+.${buttonNs.b()} {
            margin-inline-start: 0px;
        }
    `
}

async function handleTest() {
    const loading = ElLoading.service({ text: "Please wait...." })
    try {
        const errorMsg = await checkAuth()
        errorMsg
            ? ElMessage.error(errorMsg)
            : ElMessage.success("Valid!")
    } finally {
        loading.close()
    }
}

const TIME_FORMAT = t(msg => msg.calendar.timeFormat)

const _default = defineComponent<{ type: timer.backup.Type }>(props => {
    const [lastTime, setLastTime] = useState<number>()

    useRequest(() => getLastBackUp(props.type).then(d => d?.ts), {
        deps: () => props.type,
        onSuccess: setLastTime,
    })

    const { refresh: handleBackup } = useManualRequest(() => syncData(), {
        loadingText: "Doing backup....",
        onSuccess: ({ success, data, errorMsg }) => {
            if (success) {
                ElMessage.success('Successfully!')
                setLastTime(data ?? Date.now())
            } else {
                ElMessage.error(errorMsg ?? 'Unknown error')
            }
        },
    })

    const footerCls = useStyle()

    return () => <>
        <ElDivider />
        <Flex gap={12} wrap class={footerCls}>
            <ElButton type="primary" icon={Operation} onClick={handleTest}>
                {t(msg => msg.button.test)}
            </ElButton>
            <Clear />
            <Download />
            <ElButton type="primary" icon={UploadFilled} onClick={handleBackup}>
                {t(msg => msg.option.backup.operation)}
            </ElButton>
            <ElText v-show={!!lastTime.value} style={{ marginInlineStart: "8px" } satisfies StyleValue}>
                {t(
                    msg => msg.option.backup.lastTimeTip,
                    { lastTime: (lastTime.value && formatTime(lastTime.value, TIME_FORMAT)) ?? '' }
                )}
            </ElText>
        </Flex>
    </>
}, { props: ['type'] })

export default _default