/**
 * Copyright (c) 2025 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import ChartTitle from '@app/components/Dashboard/ChartTitle'
import { t } from '@app/locale'
import { TIMELINE_LIFE_CYCLE } from '@db/timeline-database'
import { Collection, Files, Link } from '@element-plus/icons-vue'
import { useShadow } from '@hooks'
import { useEcharts } from "@hooks/useEcharts"
import Flex from "@pages/components/Flex"
import { type ECElementEvent, type ECharts } from "echarts/core"
import { ElIcon, ElRadioButton, ElRadioGroup } from 'element-plus'
import { computed, defineComponent } from "vue"
import { type JSX } from 'vue/jsx-runtime'
import Wrapper, { EcOption, type BizData } from './Wrapper'
import { useMerge, type MergeMethod } from './useMerge'

const CHART_CONFIG: Record<MergeMethod, JSX.Element | string> = {
    none: <Files />,
    domain: <Link />,
    cate: <Collection />,
}

const extractLegendSelected = (legends: EcOption['legend']): Record<string, boolean> => {
    if (!legends) return {}
    const result: Record<string, boolean> = {}
    const allLegends = new Set<string>()
    const legendArr = Array.isArray(legends) ? legends : [legends]
    legendArr.forEach(({ data, selected }) => {
        data?.map(d => {
            const name = typeof d === 'string' ? d : d.name
            if (!name) return
            allLegends.add(name)
        })
        Object.entries(selected ?? {}).forEach(([name, val]) => result[name] = val)
    })
    allLegends.forEach(l => result[l] ?? (result[l] = true))
    return result
}

const handleClick = (inst: ECharts, ev: ECElementEvent) => {
    const { type, seriesName } = ev
    if (type !== 'click' || !seriesName) return

    const option = inst.getOption() as EcOption
    const currSelected = extractLegendSelected(option.legend)
    const isOnlyCurrSelected = !!currSelected[seriesName] && Object.values(currSelected).filter(r => !!r).length === 1
    const seriesNames2Toggle = isOnlyCurrSelected
        ? Object.keys(currSelected).filter(k => k !== seriesName)
        : Object.entries(currSelected).filter(([k, v]) => k !== seriesName && !!v).map(([k]) => k)
    seriesNames2Toggle.forEach(name => inst.dispatchAction({ type: "legendToggleSelect", name }))
}

const TimelineChart = defineComponent<{ data: timer.timeline.Tick[] }>(props => {
    const [myData] = useShadow(() => props.data)
    const { merge, setMerge, activities, dates } = useMerge(myData)
    const bizData = computed<BizData>(() => ({
        activities: activities.value,
        merge: merge.value,
        dates,
    }))

    const { elRef } = useEcharts(Wrapper, bizData, {
        afterInit: ew => {
            const inst = ew.instance
            if (!inst) return
            inst.on('click', ev => handleClick(inst, ev))
        }
    })

    return () => (
        <Flex height="100%" gap={4} column>
            <ChartTitle>
                <Flex justify='space-between'>
                    <Flex align="center">
                        {t(msg => msg.dashboard.timeline.title, { n: TIMELINE_LIFE_CYCLE })}
                    </Flex>
                    <Flex align='center'>
                        <ElRadioGroup size="small" modelValue={merge.value} onChange={setMerge}>
                            {Object.entries(CHART_CONFIG).map(([k, v]) => (
                                <ElRadioButton value={k}>
                                    <ElIcon size={15}>{v}</ElIcon>
                                </ElRadioButton>
                            ))}
                        </ElRadioGroup>
                    </Flex>
                </Flex>
            </ChartTitle >
            <div ref={elRef} style={{ flex: 1 }} />
        </Flex>
    )
}, { props: ['data'] })

export default TimelineChart