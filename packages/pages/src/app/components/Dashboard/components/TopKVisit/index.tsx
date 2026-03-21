/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { useXsState } from '@hooks/useMediaSize'
import Flex from "@pages/components/Flex"
import { computed, defineComponent } from "vue"
import ChartTitle from "../../ChartTitle"
import BarChart from "./BarChart"
import { initProvider } from "./context"
import HalfBarChart from "./HalfBarChart"
import PieChart from "./PieChart"
import Title from "./Title"

const _default = defineComponent(() => {
    const filter = initProvider()
    const isXs = useXsState()

    const chart = computed(() => {
        const type = filter.topKChartType
        if (type === 'bar' || isXs.value) {
            return <BarChart />
        } else if (type === 'pie') {
            return <PieChart />
        } else if (type === 'halfPie') {
            return <HalfBarChart />
        }
    })

    return () => {
        return (
            <Flex column gap={4} height="100%">
                <ChartTitle>
                    <Title />
                </ChartTitle >
                <Flex flex={1}>
                    {chart.value}
                </Flex>
            </Flex>
        )
    }
})

export default _default