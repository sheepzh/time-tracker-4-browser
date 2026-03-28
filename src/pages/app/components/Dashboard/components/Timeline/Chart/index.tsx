/**
 * Copyright (c) 2025 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import ChartTitle from '@app/components/Dashboard/ChartTitle'
import { t } from '@app/locale'
import { Collection, Files, Link } from '@element-plus/icons-vue'
import { useEcharts } from '@hooks'
import Flex from "@pages/components/Flex"
import { type ECElementEvent, type ECharts } from "echarts/core"
import { ElIcon, ElRadioButton, ElRadioGroup } from 'element-plus'
import { computed, defineComponent } from "vue"
import { type JSX } from 'vue/jsx-runtime'
import { TIMELINE_DAY_COUNT, useTimelineContext } from '../context'
import Wrapper, { BizData, EcOption } from './Wrapper'

const CHART_CONFIG: Record<timer.timeline.MergeMethod, JSX.Element | string> = {
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

const TimelineChart = defineComponent<{}>(() => {
    const { dates, activities, merge, setMerge } = useTimelineContext()
    const bizData = computed<BizData>(() => ({ dates, activities: activities.value, merge: merge.value }))

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
                        {t(msg => msg.dashboard.timeline.title, { n: TIMELINE_DAY_COUNT })}
                    </Flex>
                    <Flex align='center'>
                        <ElRadioGroup
                            size="small"
                            modelValue={merge.value}
                            onChange={val => setMerge(val as timer.timeline.MergeMethod)}
                        >
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
})

export default TimelineChart