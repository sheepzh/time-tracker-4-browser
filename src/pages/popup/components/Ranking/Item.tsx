import { createTab } from "@api/chrome/tab"
import { cvtGroupColor } from "@api/chrome/tabGroups"
import TooltipWrapper from "@app/components/common/TooltipWrapper"
import { Mouse, Timer } from "@element-plus/icons-vue"
import { useTabGroups } from "@hooks/useTabGroups"
import Flex from "@pages/components/Flex"
import { calJumpUrl } from "@popup/common"
import { useCateNameMap, useQuery } from "@popup/context"
import { t } from "@popup/locale"
import { isRemainHost } from "@util/constant/remain-host"
import { getGroupName, getIconUrl, isCate, isGroup, isNormalSite, isSite } from "@util/stat"
import { formatPeriodCommon } from "@util/time"
import { ElAvatar, ElCard, ElIcon, ElLink, ElProgress, ElTag, ElText } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"

const TITLE_STYLE: StyleValue = {
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    fontSize: 'var(--el-font-size-small)',
}

type TitleProps = Pick<ItemProps, 'value' | 'date' | 'displaySiteName'>

const Title = defineComponent<TitleProps>(props => {
    const query = useQuery()
    const cateNameMap = useCateNameMap()
    const { groupMap } = useTabGroups()
    const nameAndTooltip = computed((): [name: string, tooltip?: string] => {
        const { value: row, displaySiteName = false } = props
        if (isGroup(row)) {
            const title = groupMap.value[row.groupKey]?.title ?? 'NaN'
            return [title]
        } else if (isCate(row)) {
            const { mergedRows } = row
            const mergedTooltip = t(msg => msg.content.ranking.includingCount, { siteCount: mergedRows?.length ?? 0 })
            const name = cateNameMap.value[row.cateKey] ?? 'NaN'
            return [name, mergedTooltip]
        } else if (isSite(row)) {
            const { mergedRows } = row
            const mergedTooltip = t(msg => msg.content.ranking.includingCount, { siteCount: mergedRows?.length ?? 0 })
            const { siteKey: { host, type: siteType }, alias } = row
            const name = displaySiteName ? alias ?? host : host
            const tooltip = siteType === 'merged' ? mergedTooltip : (displaySiteName ? host : undefined)
            return [name, tooltip]
        }
        return ['NaN']
    })

    const url = computed(() => calJumpUrl(props.value, props.date, query.dimension))

    return () => (
        <TooltipWrapper
            usePopover={!!nameAndTooltip.value[1]}
            offset={4}
            placement="top"
            v-slots={{ content: () => nameAndTooltip.value[1] }}
        >
            <ElLink style={TITLE_STYLE} onClick={() => url.value && createTab(url.value)}>
                {nameAndTooltip.value[0]}
            </ElLink>
        </TooltipWrapper>
    )
}, { props: ['value', 'date', 'displaySiteName'] })

const renderAvatarText = (row: timer.stat.Row, cateNameMap: Record<number, string>, groupMap: Record<number, chrome.tabGroups.TabGroup>) => {
    let name: string | undefined = undefined
    if (isGroup(row)) {
        name = getGroupName(groupMap, row)
    } else if (isCate(row)) {
        name = cateNameMap[row.cateKey]
    } else if (isSite(row)) {
        const { siteKey: { host }, alias } = row
        name = alias ?? host
    }
    return name?.substring(0, 1)?.toUpperCase?.() ?? 'NaN'
}

type ItemProps = {
    value: timer.stat.Row
    max?: number
    total?: number
    date?: Date | [start: Date, end?: Date]
    displaySiteName?: boolean
    onJump?: NoArgCallback
}

const Item = defineComponent<ItemProps>(props => {
    const query = useQuery()
    const cateNameMap = useCateNameMap()
    const { groupMap } = useTabGroups()

    const rate = computed(() => props.max ? (props.value?.[query.dimension] ?? 0) / props.max * 100 : 0)
    const percentage = computed(() => props.total ? (props.value?.[query.dimension] ?? 0) / props.total * 100 : 0)
    const clickable = computed(() => isNormalSite(props.value) && !isRemainHost(props.value.siteKey.host))
    const iconUrl = computed(() => getIconUrl(props.value))
    const iconBgColor = computed(() => {
        const row = props.value
        if (isGroup(row)) {
            const color = groupMap.value[row.groupKey]?.color
            return color ? cvtGroupColor(color) : undefined
        }
        return iconUrl.value ? 'transparent' : undefined
    })

    const emitJump = () => clickable.value && props.onJump?.()

    return () => (
        <ElCard
            shadow="hover"
            style={{ padding: 0, height: '80px' }}
            bodyStyle={{ padding: '5px 10px', height: '100%', boxSizing: 'border-box' }}
        >
            <Flex height='100%' gap={10}>
                <Flex
                    width={40}
                    align="center"
                    justify="space-around"
                    cursor={clickable.value ? 'pointer' : undefined}
                    onClick={emitJump}
                >
                    <ElAvatar
                        src={iconUrl.value}
                        shape="square"
                        fit="fill"
                        style={{
                            backgroundColor: iconBgColor.value,
                            padding: '2px',
                            userSelect: 'none',
                            fontSize: '22px',
                        } satisfies StyleValue}
                    >
                        {renderAvatarText(props.value, cateNameMap.value, groupMap.value)}
                    </ElAvatar>
                </Flex>
                <Flex column flex={1}>
                    <Flex align="center" justify="space-between" height={24} gap={4}>
                        <Flex width={0} flex={1} justify="start">
                            <Title
                                value={props.value}
                                date={props.date}
                                displaySiteName={props.displaySiteName}
                            />
                        </Flex>
                        <ElTag
                            size="small"
                            style={{ fontSize: '10px', padding: '1px 3px', height: '16px' }}
                        >
                            {percentage.value.toFixed(2)}%
                        </ElTag>
                    </Flex>
                    <Flex column justify="space-around" flex={1}>
                        <Flex justify="space-between" width="100%" cursor="unset">
                            <ElText type={query.dimension === 'time' ? 'primary' : 'info'} size="small">
                                <ElIcon>
                                    <Mouse />
                                </ElIcon>
                                {props.value?.time ?? 0}
                            </ElText>
                            <ElText type={query.dimension === 'focus' ? 'primary' : 'info'} size="small">
                                <ElIcon>
                                    <Timer />
                                </ElIcon>
                                {formatPeriodCommon(props.value?.focus ?? 0)}
                            </ElText>
                        </Flex>
                        <ElProgress percentage={rate.value} showText={false} />
                    </Flex>
                </Flex>
            </Flex>
        </ElCard >
    )
}, { props: ['date', 'displaySiteName', 'max', 'total', 'value', 'onJump'] })

export default Item
