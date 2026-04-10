import { BarChart, CustomChart, EffectScatterChart, LineChart, PieChart, ScatterChart } from "echarts/charts"
import {
    AriaComponent,
    DataZoomComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapComponent,
} from "echarts/components"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"

export * from './util/echarts'

export const initEcharts = () => {
    use([
        CanvasRenderer,
        AriaComponent, GridComponent, TooltipComponent, TitleComponent, VisualMapComponent, LegendComponent, DataZoomComponent,
        BarChart, PieChart, LineChart, ScatterChart, EffectScatterChart, CustomChart,
    ])
}