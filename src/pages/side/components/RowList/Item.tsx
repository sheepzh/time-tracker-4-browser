import { createTab } from "@api/chrome/tab"
import { useShadow } from "@hooks"
import Flex from "@pages/components/Flex"
import { isRemainHost } from "@util/constant/remain-host"
import { getAlias, getHost, isSite } from "@util/stat"
import { formatPeriodCommon } from "@util/time"
import { ElAvatar, ElCard, ElLink, ElProgress, ElTag, ElText, ElTooltip } from "element-plus"
import { computed, defineComponent, type PropType } from "vue"

const renderTitle = (siteName: string | undefined, host: string | undefined, handleJump: () => void) => {
    const text = siteName ?? host ?? ''
    const tooltip = siteName ? host : null
    const textNode = <ElLink onClick={handleJump}>{text}</ElLink>
    if (!tooltip) return textNode
    return (
        <ElTooltip content={tooltip} placement="top" offset={4}>
            {textNode}
        </ElTooltip >
    )
}

const renderAvatarText = (row: timer.stat.Row) => {
    const alias = getAlias(row)
    if (alias) return alias.substring(0, 1)?.toUpperCase?.()
    return getHost(row)?.substring?.(0, 1)?.toUpperCase?.()
}

const _default = defineComponent({
    props: {
        value: {
            type: Object as PropType<timer.stat.Row>,
            required: true,
        },
        max: Number,
        total: Number,
    },
    setup(props) {
        const [iconUrl] = useShadow(() => 'iconUrl' in props.value ? props.value?.iconUrl : undefined)
        const [host] = useShadow(() => getHost(props.value))
        const [siteName] = useShadow(() => getAlias(props.value))
        const clickable = computed(() => host?.value && !isRemainHost(host.value))
        const [rate] = useShadow(() => {
            if (!props.max) return 0
            return (props.value?.focus ?? 0) / props.max * 100
        }, 0)
        const [percentage] = useShadow(() => {
            if (!props.total) return '0 %'
            const val = (props.value?.focus ?? 0) / props.total * 100
            return val.toFixed(2) + ' %'
        })
        const handleJump = () => clickable.value && createTab("https://" + host.value)
        return () => (
            <ElCard
                shadow="hover"
                style={{ padding: '0 10px', height: '70px', boxSizing: 'border-box' }}
                bodyStyle={{ padding: '5px', display: 'flex', height: 'calc(100% - 10px)' }}
            >
                <Flex
                    width={50}
                    align="center"
                    justify="space-around"
                    boxSizing="content-box"
                    cursor={clickable.value ? 'pointer' : undefined}
                    onClick={handleJump}
                >
                    <ElAvatar
                        src={iconUrl.value}
                        shape="square"
                        fit="fill"
                        style={{
                            backgroundColor: isSite(props.value) && props.value.iconUrl ? "transparent" : null,
                            padding: '2px',
                            userSelect: 'none',
                            fontSize: '22px',
                        }}
                    >
                        {renderAvatarText(props.value)}
                    </ElAvatar>
                </Flex>
                <Flex
                    column flex={1}
                    style={{ marginInlineStart: '10px', paddingInlineEnd: '10px' }}
                >
                    <Flex align="center" justify="space-between" height={24}>
                        {renderTitle(siteName.value, host.value, handleJump)}
                        <ElTag
                            size="small"
                            style={{ fontSize: '10px', padding: '0 3px', height: '16px' }}
                        >
                            {percentage.value}
                        </ElTag>
                    </Flex>
                    <Flex column justify="space-around" flex={1}>
                        <Flex justify="end" width="100%">
                            <ElText size="small">
                                {formatPeriodCommon(props.value?.focus ?? 0)}
                            </ElText>
                        </Flex>
                        <ElProgress percentage={rate.value} showText={false} />
                    </Flex>
                </Flex>
            </ElCard >
        )
    }
})

export default _default