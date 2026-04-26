/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import Flex from "@pages/components/Flex"
import Img from '@pages/components/Img'
import { IS_SAFARI } from "@util/constant/environment"
import { isRemainHost } from "@util/constant/remain-host"
import { ElLink } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"

type Props = {
    value: timer.site.SiteKey
    iconUrl?: string
    clickable?: boolean
}

const HostAlert = defineComponent<Props>(props => {
    const clickable = computed(() => {
        const { clickable = true, value: { host, type } = {} } = props
        return !!clickable && type === 'normal' && !!host && !isRemainHost(host)
    })
    const href = computed(() => clickable.value ? `http://${props.value.host}` : '')
    const target = computed(() => clickable.value ? '_blank' : '')
    const style = computed<StyleValue>(() => ({ cursor: clickable.value ? "cursor" : "default" }))
    return () => <div style={{ wordBreak: "break-all" }}>
        {IS_SAFARI ? (
            <ElLink
                href={href.value}
                target={target.value}
                underline={clickable.value ? "hover" : "never"}
                style={style.value}
            >
                {props.value?.host}
            </ElLink>
        ) : (
            <Flex justify="center" align="center" gap={3} >
                <ElLink
                    href={href.value}
                    target={target.value}
                    underline={clickable.value ? "hover" : "never"}
                    style={style.value}
                >
                    {props.value?.host}
                </ElLink>
                <Flex align="center">
                    <Img src={props.iconUrl} size={12} />
                </Flex>
            </Flex>
        )}
    </div>
}, { props: ['clickable', 'iconUrl', 'value'] })

export default HostAlert