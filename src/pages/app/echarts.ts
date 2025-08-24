import { BarChart, CustomChart, EffectScatterChart, HeatmapChart, LineChart, PieChart, ScatterChart } from "echarts/charts"
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

export const initEcharts = () => {
    use([
        CanvasRenderer,
        AriaComponent, GridComponent, TooltipComponent, TitleComponent, VisualMapComponent, LegendComponent, DataZoomComponent,
        BarChart, PieChart, LineChart, HeatmapChart, ScatterChart, EffectScatterChart, CustomChart,
    ])
}