import { t } from "@cs/locale"
import { css } from '@emotion/css'
import { useRequest } from "@hooks/useRequest"
import Flex from "@pages/components/Flex"
import { matchCond, meetLimit, meetTimeLimit, period2Str } from "@util/limit"
import { formatPeriodCommon, MILL_PER_SECOND } from "@util/time"
import { ElDescriptions, ElDescriptionsItem, ElTag, useNamespace } from 'element-plus'
import { computed, defineComponent } from "vue"
import { useGlobalParam, useReason, useRule } from "../context"

const renderBaseItems = (rule: timer.limit.Rule | null, url: string) => <>
    <ElDescriptionsItem label={t(msg => msg.limit.item.name)} labelAlign="right">
        {rule?.name ?? '-'}
    </ElDescriptionsItem>
    <ElDescriptionsItem label={t(msg => msg.limit.item.condition)} labelAlign='right'>
        {matchCond(rule?.cond ?? [], url)?.join(', ')}
    </ElDescriptionsItem>
</>

const TimeDescriptions = defineComponent({
    props: {
        // Seconds
        time: Number,
        // Milliseconds
        waste: Number,
        count: Number,
        visit: Number,
        ruleLabel: String,
        dataLabel: String,
    },
    setup(props) {
        const rule = useRule()
        const reason = useReason()
        const { url } = useGlobalParam()

        const timeLimited = computed(() => meetTimeLimit(props.time ?? 0, props.waste ?? 0, !!reason.value?.allowDelay, reason.value?.delayCount ?? 0))
        const visitLimited = computed(() => meetLimit(props.count ?? 0, props.visit ?? 0))

        return () => (
            <ElDescriptions border column={1} labelWidth={130}>
                {renderBaseItems(rule.value, url)}
                <ElDescriptionsItem label={props.ruleLabel} labelAlign="right">
                    <Flex gap={5} width={200}>
                        <ElTag v-show={!!props.time}>{formatPeriodCommon((props.time ?? 0) * MILL_PER_SECOND)}</ElTag>
                        <ElTag v-show={!!props.count}>{`${props.count ?? 0} ${t(msg => msg.limit.item.visits)}`}</ElTag>
                    </Flex>
                </ElDescriptionsItem>
                <ElDescriptionsItem label={props.dataLabel} labelAlign="right">
                    <Flex gap={5} width={200}>
                        <ElTag
                            v-show={!!props.waste || !!props.time}
                            type={timeLimited.value ? 'danger' : 'info'}
                        >
                            {formatPeriodCommon(props.waste ?? 0)}
                        </ElTag>
                        <ElTag
                            v-show={!!props.count || !!props.visit}
                            type={visitLimited.value ? 'danger' : 'info'}
                        >
                            {`${props.visit ?? 0} ${t(msg => msg.limit.item.visits)}`}
                        </ElTag>
                    </Flex>
                </ElDescriptionsItem>
                <ElDescriptionsItem
                    v-show={!!reason.value?.allowDelay && !!props.time}
                    label={t(msg => msg.limit.item.delayCount)}
                    labelAlign="right"
                >
                    {reason.value?.delayCount ?? 0}
                </ElDescriptionsItem>
            </ElDescriptions>
        )
    },
})

const _default = defineComponent(() => {
    const reason = useReason()
    const rule = useRule()
    const { url } = useGlobalParam()
    const type = computed(() => reason.value?.type)

    const { data: browsingTime, refresh: refreshBrowsingTime } = useRequest(() => {
        const { getVisitTime, type } = reason.value || {}
        if (type !== 'VISIT') return
        return getVisitTime?.() || 0
    })

    setInterval(refreshBrowsingTime, 1000)

    const descriptionsNs = useNamespace('descriptions')
    const reasonCls = css`
        margin-bottom: 30px;
        .${descriptionsNs.b()} {
            margin: auto;
            width: 400px;
        }
    `

    return () => (
        <div class={reasonCls}>
            <TimeDescriptions
                v-show={type.value === 'DAILY'}
                time={rule.value?.time}
                count={rule.value?.count}
                waste={rule.value?.waste}
                visit={rule.value?.visit}
                ruleLabel={t(msg => msg.limit.item.daily)}
                dataLabel={t(msg => msg.calendar.range.today)}
            />
            <TimeDescriptions
                v-show={type.value === 'WEEKLY'}
                time={rule.value?.weekly}
                count={rule.value?.weeklyCount}
                waste={rule.value?.weeklyWaste}
                visit={rule.value?.weeklyVisit}
                ruleLabel={t(msg => msg.limit.item.weekly)}
                dataLabel={t(msg => msg.calendar.range.thisWeek)}
            />
            <ElDescriptions border column={1} v-show={type.value === 'VISIT'}>
                {renderBaseItems(rule.value, url)}
                <ElDescriptionsItem label={t(msg => msg.limit.item.visitTime)} labelAlign="right">
                    {formatPeriodCommon((rule.value?.visitTime ?? 0) * MILL_PER_SECOND) || '-'}
                </ElDescriptionsItem>
                <ElDescriptionsItem label={t(msg => msg.modal.browsingTime)} labelAlign="right">
                    {browsingTime.value ? formatPeriodCommon(browsingTime.value) : '-'}
                </ElDescriptionsItem>
                <ElDescriptionsItem
                    v-show={!!reason.value?.allowDelay || !!reason.value?.delayCount}
                    label={t(msg => msg.limit.item.delayCount)} labelAlign="right">
                    {reason.value?.delayCount ?? 0}
                </ElDescriptionsItem>
            </ElDescriptions>
            <ElDescriptions border column={1} v-show={type.value === 'PERIOD'}>
                {renderBaseItems(rule.value, url)}
                <ElDescriptionsItem label={t(msg => msg.limit.item.period)} labelAlign="right">
                    {
                        rule.value?.periods?.length
                            ? <div>
                                {rule.value?.periods.map(p => <span style={{ display: "block" }}>{period2Str(p)}</span>)}
                            </div>
                            : '-'
                    }
                </ElDescriptionsItem>
            </ElDescriptions>
        </div>
    )
})

export default _default