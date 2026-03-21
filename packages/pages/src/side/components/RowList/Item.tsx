import { createTab } from "@api/chrome/tab"
import Flex from "@pages/components/Flex"
import { isRemainHost } from "@util/constant/remain-host"
import { getAlias, getHost, isSite } from "@util/stat"
import { formatPeriodCommon } from "@util/time"
import { ElAvatar, ElCard, ElLink, ElProgress, ElTag, ElText, ElTooltip } from "element-plus"
import { computed, defineComponent, toRef } from "vue"

const renderTitle = (siteName: string | undefined, host: string | undefined, handleJump: NoArgCallback) => {
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

type Props = {
    value: timer.stat.Row
    max?: number
    total?: number
}

const _default = defineComponent<Props>(props => {
    const row = toRef(props, 'value')
    const iconUrl = computed(() => 'iconUrl' in row.value ? row.value.iconUrl : undefined)
    const host = computed(() => getHost(row.value))
    const siteName = computed(() => getAlias(row.value))
    const clickable = computed(() => host.value && !isRemainHost(host.value))
    const rate = computed(() => {
        if (!props.max) return 0
        return (row.value?.focus ?? 0) / props.max * 100
    })
    const percentage = computed(() => {
        if (!props.total) return '0 %'
        const val = (row.value?.focus ?? 0) / props.total * 100
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
}, { props: ['value', 'max', 'total'] })

export default _default