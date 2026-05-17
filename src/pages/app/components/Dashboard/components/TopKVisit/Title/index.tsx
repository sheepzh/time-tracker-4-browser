import { tN } from "@app/locale"
import { useXsState } from '@hooks'
import Flex from "@pages/components/Flex"
import IconRadioGroup from '@pages/components/IconRadioGroup'
import { BarChart, HalfPieChart, RoseChart } from '@pages/icons'
import { type Component, defineComponent } from "vue"
import { type TopKChartType, useTopKFilter } from "../context"
import TitleSelect from "./TitleSelect"

const CHART_CONFIG: { [type in TopKChartType]: Component } = {
    pie: RoseChart,
    bar: BarChart,
    halfPie: HalfPieChart,
}

const Title = defineComponent(() => {
    const filter = useTopKFilter()
    const isXs = useXsState()

    return () => (
        <Flex align="center" justify="space-between">
            <Flex align="center" wrap columnGap={3} rowGap={2}>
                {tN(msg => msg.dashboard.topK.title, {
                    k: <TitleSelect field="topK" values={[6, 8, 10, 12]} />,
                    day: <TitleSelect field="dayNum" values={[7, 30, 90, 180]} />,
                })}
            </Flex>
            <IconRadioGroup
                v-show={!isXs.value}
                modelValue={filter.topKChartType}
                onChange={val => filter.topKChartType = val as TopKChartType}
                options={Object.entries(CHART_CONFIG).map(([value, icon]) => ({ value, icon }))}
            />
        </Flex>
    )
})

export default Title