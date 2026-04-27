import { tN } from "@app/locale"
import { css } from '@emotion/css'
import { useXsState } from '@hooks'
import Flex from "@pages/components/Flex"
import { BarChart, HalfPieChart, RoseChart } from '@pages/icons'
import { ElIcon, ElRadioButton, ElRadioGroup, useNamespace } from "element-plus"
import { type Component, defineComponent, h } from "vue"
import { type TopKChartType, useTopKFilter } from "../context"
import TitleSelect from "./TitleSelect"

const CHART_CONFIG: { [type in TopKChartType]: Component } = {
    pie: RoseChart,
    bar: BarChart,
    halfPie: HalfPieChart,
}

const useRadioStyle = () => {
    const radioNs = useNamespace('radio')
    return css`
        & .${radioNs.be('button', 'inner')} {
            padding: 3px 5px;
        }
    `
}

const Title = defineComponent(() => {
    const filter = useTopKFilter()
    const isXs = useXsState()
    const radioCls = useRadioStyle()

    return () => (
        <Flex align="center" justify="space-between">
            <Flex align="center" wrap columnGap={3} rowGap={2}>
                {tN(msg => msg.dashboard.topK.title, {
                    k: <TitleSelect field="topK" values={[6, 8, 10, 12]} />,
                    day: <TitleSelect field="dayNum" values={[7, 30, 90, 180]} />,
                })}
            </Flex>
            <Flex width={90} justify='end'>
                <ElRadioGroup
                    v-show={!isXs.value}
                    size="small"
                    modelValue={filter.topKChartType}
                    onChange={val => filter.topKChartType = val as TopKChartType}
                >
                    {Object.entries(CHART_CONFIG).map(([k, v]) => (
                        <ElRadioButton value={k} class={radioCls}>
                            <ElIcon size={15}>{h(v)}</ElIcon>
                        </ElRadioButton>
                    ))}
                </ElRadioGroup>
            </Flex>
        </Flex>
    )
})

export default Title