import HostAlert from "@app/components/common/HostAlert"
import PopupConfirmButton from "@app/components/common/PopupConfirmButton"
import TooltipWrapper from "@app/components/common/TooltipWrapper"
import { cvt2LocaleTime, periodFormatter } from "@app/util/time"
import { Calendar, Delete, Mouse, QuartzWatch } from "@element-plus/icons-vue"
import { Effect, ElCheckbox, ElDivider, ElIcon, ElTag } from "element-plus"
import { computed, defineComponent, type PropType, ref, watch } from "vue"
import { computeDeleteConfirmMsg, handleDelete } from "../common"
import CompositionTable from "../CompositionTable"
import { useReportFilter } from "../context"
import TooltipSiteList from "../ReportTable/columns/TooltipSiteList"

const _default = defineComponent({
    props: {
        value: {
            type: Object as PropType<timer.stat.Row>,
            required: true,
        },
    },
    emits: {
        selectedChange: (_val: boolean) => true,
        delete: (_val: timer.stat.Row) => true,
    },
    setup(props, ctx) {
        const filter = useReportFilter()
        const mergeHost = computed(() => filter?.siteMerge === 'domain')
        const formatter = (focus: number): string => periodFormatter(focus, { format: filter?.timeFormat })
        const { siteKey, iconUrl, mergedRows, date, focus, composition, time } = props.value
        const selected = ref(false)
        watch(selected, val => ctx.emit('selectedChange', val))

        const canDelete = computed(() => !mergeHost.value && !filter.readRemote)
        const onDelete = async () => {
            await handleDelete(props.value, filter)
            ctx.emit('delete', props.value)
        }
        return () => (
            <div class="report-item">
                <div class="report-item-head">
                    <div class="report-item-title">
                        <ElCheckbox
                            v-show={canDelete.value}
                            size="small"
                            value={selected.value}
                            onChange={val => selected.value = !!val}
                        />
                        {!!siteKey && (
                            <TooltipWrapper
                                placement="bottom"
                                effect={Effect.LIGHT}
                                offset={10}
                                trigger="click"
                                usePopover={mergeHost.value}
                                v-slots={{
                                    content: () => <TooltipSiteList modelValue={mergedRows} />,
                                }}
                            >
                                <HostAlert
                                    value={siteKey}
                                    iconUrl={mergeHost.value ? undefined : iconUrl}
                                    clickable={false}
                                />
                            </TooltipWrapper>
                        )}
                    </div>
                    <PopupConfirmButton
                        buttonIcon={<Delete />}
                        buttonType="danger"
                        confirmText={computeDeleteConfirmMsg(props.value, filter)}
                        visible={canDelete.value}
                        onConfirm={onDelete}
                        text
                    />
                </div>
                <ElDivider style={{ margin: "5px 0" }} />
                <div class="report-item-content">
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
                            content: () => <CompositionTable valueFormatter={formatter} data={composition?.focus || []} />,
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
                            content: () => <CompositionTable data={composition?.time || []} />,
                        }}
                    >
                        <ElTag type="warning" size="small">
                            <ElIcon><Mouse /></ElIcon>
                            <span>{time ?? 0}</span>
                        </ElTag>
                    </TooltipWrapper>
                </div>
            </div>
        )
    },
})

export default _default