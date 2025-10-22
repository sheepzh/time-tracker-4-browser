import HostAlert from "@app/components/common/HostAlert"
import PopupConfirmButton from "@app/components/common/PopupConfirmButton"
import TooltipWrapper from "@app/components/common/TooltipWrapper"
import { cvt2LocaleTime, periodFormatter } from "@app/util/time"
import { Calendar, Delete, Mouse, QuartzWatch } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useTabGroups } from "@hooks/useTabGroups"
import Flex from '@pages/components/Flex'
import { getComposition, isGroup, isNormalSite, isSite } from "@util/stat"
import { Effect, ElCheckbox, ElDivider, ElIcon, ElTag, useNamespace } from "element-plus"
import { computed, defineComponent, ref, StyleValue, watch } from "vue"
import { computeDeleteConfirmMsg, handleDelete } from "../common"
import CompositionTable from "../CompositionTable"
import { useReportFilter } from "../context"
import TooltipSiteList from "../ReportTable/columns/TooltipSiteList"

type Props = {
    value: timer.stat.Row
    onSelectedChange: ArgCallback<boolean>
    onDelete?: ArgCallback<timer.stat.Row>
}

const useContentClz = () => {
    const tagNs = useNamespace('tag')
    return css`
        .${tagNs.e('content')} {
            display: flex;
            align-items: center;
            gap: 2px;
        }
        &:after {
            content: "";
            flex: auto;
        }
    `
}

const _default = defineComponent<Props>(props => {
    const filter = useReportFilter()
    const { groupMap } = useTabGroups()
    const formatter = (focus: number): string => periodFormatter(focus, { format: filter?.timeFormat })
    const { date, focus, time } = props.value
    const mergedRows = isGroup(props.value) ? [] : props.value?.mergedRows ?? []
    const selected = ref(false)
    watch(selected, val => props.onSelectedChange?.(val))

    const canDelete = computed(() => isNormalSite(props.value) && !filter.readRemote)
    const onDelete = async () => {
        await handleDelete(props.value, filter)
        props.onDelete?.(props.value)
    }

    const contentClz = useContentClz()
    return () => (
        <div>
            <Flex justify='space-between'>
                <Flex inline align='center' gap={2}>
                    <ElCheckbox
                        v-show={canDelete.value}
                        size="small"
                        value={selected.value}
                        onChange={val => selected.value = !!val}
                        style={{ height: '100%' } satisfies StyleValue}
                    />
                    {isSite(props.value) && (
                        <TooltipWrapper
                            placement="bottom"
                            effect={Effect.LIGHT}
                            offset={10}
                            trigger="click"
                            usePopover={props.value.siteKey.type === 'merged'}
                            v-slots={{
                                content: () => <TooltipSiteList modelValue={mergedRows} />,
                            }}
                        >
                            <HostAlert
                                value={props.value.siteKey}
                                iconUrl={props.value.iconUrl}
                                clickable={false}
                            />
                        </TooltipWrapper>
                    )}
                </Flex>
                {canDelete.value && (
                    <PopupConfirmButton
                        buttonStyle={{ padding: 0 }}
                        buttonIcon={Delete}
                        buttonType="danger"
                        confirmText={computeDeleteConfirmMsg(props.value, filter, groupMap.value)}
                        onConfirm={onDelete}
                        text
                    />
                )}
            </Flex>
            <ElDivider style={{ margin: "5px 0" }} />
            <Flex gap={5} wrap justify="space-between" class={contentClz}>
                <ElTag v-show={!filter?.mergeDate} type="info" size="small">
                    <ElIcon><Calendar /></ElIcon>
                    <span>{cvt2LocaleTime(date)}</span>
                </ElTag>
                <TooltipWrapper
                    placement="top"
                    effect={Effect.LIGHT}
                    offset={10}
                    trigger="click"
                    v-slots={{
                        content: () => <CompositionTable valueFormatter={formatter} data={getComposition(props.value, 'focus')} />,
                    }}
                >
                    <ElTag type="primary" size="small">
                        <ElIcon><QuartzWatch /></ElIcon>
                        <span>{periodFormatter(focus, { format: filter?.timeFormat })}</span>
                    </ElTag>
                </TooltipWrapper>
                <TooltipWrapper
                    placement="top"
                    effect={Effect.LIGHT}
                    offset={10}
                    trigger="click"
                    v-slots={{
                        content: () => <CompositionTable data={getComposition(props.value, 'time')} />,
                    }}
                >
                    <ElTag type="warning" size="small">
                        <ElIcon><Mouse /></ElIcon>
                        <span>{time ?? 0}</span>
                    </ElTag>
                </TooltipWrapper>
            </Flex>
        </div>
    )
}, { props: ['onDelete', 'onSelectedChange', 'value'] })

export default _default