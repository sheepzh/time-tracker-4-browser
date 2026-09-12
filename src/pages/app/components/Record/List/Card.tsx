
import HostAlert from '@app/components/common/HostAlert'
import { useCategory } from '@app/context'
import { cvt2LocaleTime, periodFormatter } from '@app/util/time'
import { Calendar, Delete, Mouse, QuartzWatch } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { ConfirmButton, Flex, TooltipWrapper } from '@pages/components'
import { getComposition, isCate, isSite } from "@util/stat"
import { Effect, ElCard, ElCheckbox, ElDivider, ElIcon, ElTag, ElText, useNamespace } from "element-plus"
import { computed, defineComponent, StyleValue, type FunctionalComponent } from "vue"
import { computeDeleteConfirmMsg, handleDelete } from "../common"
import CompositionTable from "../components/CompositionTable"
import TooltipSiteList from "../components/TooltipSiteList"
import { useRecordFilter } from "../context"

type Props = {
    value: tt4b.stat.Row
    onSelectedChange: ArgCallback<boolean>
    onDelete?: ArgCallback<tt4b.stat.Row>
}

const useContentStyle = () => {
    const tagNs = useNamespace('tag')
    return css`
        & .${tagNs.b()} {
            padding: 0 4px;
        }
        & .${tagNs.e('content')} {
            display: flex;
            align-items: center;
            gap: 2px;
        }
    `
}

const SiteTitle: FunctionalComponent<{ value: tt4b.stat.SiteRow, cateNames: Record<number, string> }> = ({
    value: { siteKey, mergedRows, iconUrl, cateId }, cateNames,
}) => <>
        <TooltipWrapper
            placement="bottom"
            effect={Effect.LIGHT}
            offset={10}
            trigger="click"
            usePopover={siteKey.type === 'merged'}
            v-slots={{
                content: () => <TooltipSiteList modelValue={mergedRows ?? []} />,
                default: () => <HostAlert value={siteKey} iconUrl={iconUrl} clickable={false} />,
            }}
        />
        {!!cateId && !!cateNames[cateId] && <ElTag size='small'>{cateNames[cateId]}</ElTag>}
    </>

const Card = defineComponent<Props>(props => {
    const { nameMap } = useCategory()
    const filter = useRecordFilter()
    const formatter = (focus: number): string => periodFormatter(focus, { format: filter?.timeFormat })
    const { date, focus, time } = props.value

    const canDelete = computed(() => isSite(props.value) && !filter.siteMerge && !filter.readRemote)
    const onDelete = async () => {
        await handleDelete(props.value, filter)
        props.onDelete?.(props.value)
    }

    const contentCls = useContentStyle()

    return () => (
        <ElCard shadow='never' bodyStyle={{ padding: '15px' }}>
            <Flex justify='space-between'>
                <Flex inline align='center' gap={2}>
                    <ElCheckbox
                        v-show={canDelete.value}
                        size="small"
                        onChange={val => props.onSelectedChange?.(!!val)}
                        style={{ height: '100%' } satisfies StyleValue}
                    />
                    {isCate(props.value) && <ElText size='small'>{nameMap[props.value.cateKey]}</ElText>}
                    {isSite(props.value) && <SiteTitle value={props.value} cateNames={nameMap} />}
                </Flex>
                <ConfirmButton
                    visible={canDelete.value}
                    buttonProps={{ icon: Delete, type: 'danger', text: true, size: 'small' }}
                    style={{ padding: 0 }}
                    confirmText={computeDeleteConfirmMsg(props.value, filter, {})}
                    onConfirm={onDelete}
                />
            </Flex>
            <ElDivider style={{ margin: "5px 0" }} />
            <Flex wrap gap={5} class={contentCls}>
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
                        content: () => <CompositionTable formatter={formatter} data={getComposition(props.value, 'focus')} />,
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
                        <span>{time}</span>
                    </ElTag>
                </TooltipWrapper>
            </Flex>
        </ElCard>
    )
}, { props: ['onDelete', 'onSelectedChange', 'value'] })

export default Card