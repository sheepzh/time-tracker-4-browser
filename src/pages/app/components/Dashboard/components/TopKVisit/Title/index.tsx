import { tN } from "@app/locale"
import Flex from "@pages/components/Flex"
import { ElIcon, ElRadioButton, ElRadioGroup } from "element-plus"
import { defineComponent } from "vue"
import type { JSX } from "vue/jsx-runtime"
import { type TopKChartType, useTopKFilter } from "../context"
import TitleSelect from "./TitleSelect"

const CHART_CONFIG: { [type in TopKChartType]: JSX.Element | string } = {
    pie: (
        <svg viewBox="0 0 1024 1024">
            <path d="M512 256a256 256 0 1 0 256 256 256 256 0 0 0-256-256z m0 384a128 128 0 1 1 128-128 128 128 0 0 1-128 128z" />
            <path d="M768 320l-153.6 115.84A128 128 0 0 1 640 512a128 128 0 0 1-37.44 90.56l135.68 135.68A320 320 0 0 0 768 320z" />
            <path d="M602.56 602.56a128 128 0 0 1-181.12 0l-181.12 181.12a384 384 0 0 0 544 0z" />
            <path d="M384 512a128 128 0 0 1 128-128V64a448 448 0 0 0-316.8 764.8l226.24-226.24A128 128 0 0 1 384 512z" />
        </svg>
    ),
    bar: (
        <svg viewBox="0 0 1024 1024">
            <g transform="matrix(-1 0 0 -1 1024 1024)">
                <g transform="matrix(0 1 -1 0 1024 -0)">
                    <path d="M213.312 213.312v597.376h597.376V213.312H213.312z m0-85.312h597.376A85.312 85.312 0 0 1 896 213.312v597.376A85.376 85.376 0 0 1 810.688 896H213.312A85.376 85.376 0 0 1 128 810.688V213.312A85.312 85.312 0 0 1 213.312 128z m128 170.688h85.376a42.688 42.688 0 0 1 42.624 42.624v341.376a42.688 42.688 0 0 1-42.624 42.624H341.312a42.688 42.688 0 0 1-42.624-42.624V341.312a42.688 42.688 0 0 1 42.624-42.624z m256 0h85.376a42.688 42.688 0 0 1 42.624 42.624V512a42.688 42.688 0 0 1-42.624 42.688H597.312A42.688 42.688 0 0 1 554.688 512V341.312a42.688 42.688 0 0 1 42.624-42.624z" />
                </g>
            </g>
        </svg>
    ),
    halfPie: (
        <svg viewBox="0 0 1365 1024">
            <path d="M1365.055916 682.737408A682.525185 682.525185 0 1 0 91.549237 1024h1181.962989A679.005914 679.005914 0 0 0 1365.055916 682.737408z" />
        </svg>
    ),
}

const Title = defineComponent(() => {
    const filter = useTopKFilter()

    return () => (
        <Flex align="center" justify="space-between">
            <Flex align="center">
                {tN(msg => msg.dashboard.topK.title, {
                    k: <TitleSelect field="topK" values={[6, 8, 10, 12]} />,
                    day: <TitleSelect field="dayNum" values={[7, 30, 90, 180]} />,
                })}
            </Flex>
            <ElRadioGroup
                size="small"
                modelValue={filter.topKChartType}
                onChange={val => filter.topKChartType = val as TopKChartType}
            >
                {Object.entries(CHART_CONFIG).map(([k, v]) => (
                    <ElRadioButton value={k}>
                        <ElIcon size={15}>{v}</ElIcon>
                    </ElRadioButton>
                ))}
            </ElRadioGroup>
        </Flex>
    )
})

export default Title