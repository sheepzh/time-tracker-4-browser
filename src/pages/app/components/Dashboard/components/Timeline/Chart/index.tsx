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
import { useShadow } from '@hooks/index'
import { useEcharts } from "@hooks/useEcharts"
import Flex from "@pages/components/Flex"
import { ElIcon, ElRadioButton, ElRadioGroup } from 'element-plus'
import { computed, defineComponent } from "vue"
import { type JSX } from 'vue/jsx-runtime'
import Wrapper, { BizData } from './Wrapper'
import { MergeMethod, useMerge } from './useMerge'

const CHART_CONFIG: Record<MergeMethod, JSX.Element | string> = {
    none: <Files />,
    domain: <Link />,
    cate: <Collection />,
}

const TimelineChart = defineComponent<{ data: timer.timeline.Tick[] }>(props => {
    const [myData] = useShadow(() => props.data)
    const { merge, setMerge, activities, dates } = useMerge(myData)
    const bizData = computed<BizData>(() => ({
        activities: activities.value,
        merge: merge.value,
        dates,
    }))

    const { elRef } = useEcharts(Wrapper, bizData)

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