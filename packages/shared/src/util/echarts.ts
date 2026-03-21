import type {
    AriaComponentOption,
    BarSeriesOption,
    ComposeOption,
    GridComponentOption,
    LegendComponentOption,
    LineSeriesOption,
    PieSeriesOption,
    ScatterSeriesOption,
    TitleComponentOption,
    ToolboxComponentOption,
    VisualMapComponentOption,
} from "echarts"
import type { AxisBaseOption } from 'echarts/types/src/coord/axisCommonTypes.js'
import { isRtl } from "./document"

export const processAria = (option: ComposeOption<AriaComponentOption>, chartDecal: boolean) => {
    if (!option) return
    const ariaOption = generateAriaOption(chartDecal)
    option.aria = ariaOption
}

const generateAriaOption = (chartDecal: boolean): AriaComponentOption => {
    if (!chartDecal) {
        return { enabled: false }
    }
    const color = "rgba(0, 0, 0, 0.2)"
    return {
        enabled: true,
        decal: {
            show: true,
            decals: [{
                color,
                dashArrayX: [1, 0],
                dashArrayY: [2, 5],
                rotation: .5235987755982988,
            }, {
                color,
                symbol: 'circle',
                dashArrayX: [[8, 8], [0, 8, 8, 0]],
                dashArrayY: [6, 0],
                symbolSize: .8,
            }, {
                color,
                dashArrayX: [1, 0],
                dashArrayY: [4, 3],
                rotation: -.7853981633974483
            }, {
                color,
                dashArrayX: [[6, 6], [0, 6, 6, 0]],
                dashArrayY: [6, 0],
            }, {
                color,
                dashArrayX: [[1, 0], [1, 6]],
                dashArrayY: [1, 0, 6, 0],
                rotation: .7853981633974483,
            }, {
                color,
                symbol: 'triangle',
                dashArrayX: [[9, 9], [0, 9, 9, 0]],
                dashArrayY: [7, 2],
                symbolSize: .75,
            }]
        }
    }
}

type SupportedSeriesOption = PieSeriesOption | LineSeriesOption | BarSeriesOption | ScatterSeriesOption

type GlobalEcOption = ComposeOption<
    | TitleComponentOption | GridComponentOption | LegendComponentOption | ToolboxComponentOption | VisualMapComponentOption
    | SupportedSeriesOption
>

export const processFont = (toProcess: unknown, elFont: string) => {
    const options = toProcess as GlobalEcOption
    const { series, title, legend, xAxis, yAxis } = options
    processArrayLike(title, t => {
        t.textStyle = {
            ...t.textStyle,
            fontFamily: t.textStyle?.fontFamily ?? elFont,
        }
        t.subtextStyle = {
            ...t.subtextStyle,
            fontFamily: t.subtextStyle?.fontFamily ?? elFont,
        }
    })
    processArrayLike(series, s => {
        s.label = {
            ...s.label,
            fontFamily: s.label?.fontFamily ?? elFont,
        }
    })
    processArrayLike(legend, l => {
        l.textStyle = {
            ...l.textStyle,
            fontFamily: l.textStyle?.fontFamily ?? elFont,
        }
    })
    processArrayLike(xAxis, a => processAxisFont(a, elFont))
    processArrayLike(yAxis, a => processAxisFont(a, elFont))
}

const processAxisFont = (a: AxisBaseOption, elFont: string) => {
    a.axisLabel = {
        ...a.axisLabel,
        fontFamily: a.axisLabel?.fontFamily ?? elFont,
    }
}

export const processRtl = (toProcess: unknown) => {
    if (!isRtl() || !toProcess) return
    const option = toProcess as GlobalEcOption
    const { grid, legend, series, toolbox, visualMap } = option

    processArrayLike(grid, processGridRtl)
    processArrayLike(legend, processLegendRtl)
    processArrayLike(series, opt => processSeriesRtl(opt, option))
    processArrayLike(toolbox, processToolboxRtl)
    processArrayLike(visualMap, processVisualMapRtl)
}

export const processAnimation = (toProcess: unknown, duration: number) => {
    const option = toProcess as GlobalEcOption
    const { series } = option || {}
    processArrayLike(series, s => {
        if (duration > 0) {
            s.animation = true
            s.animationDuration = duration
        } else {
            s.animation = false
        }
    })
}

const processArrayLike = <T,>(arr: T | T[] | undefined, processor: (t: T) => void) => {
    if (!arr) return
    if (Array.isArray(arr)) {
        arr.filter(e => !!e).forEach(processor)
    } else {
        processor?.(arr)
    }
}

const someArrayLike = <T,>(arr: T | T[], test: (t: T) => boolean) => {
    if (!arr || !test) return false
    if (Array.isArray(arr)) {
        arr.some(test)
    } else {
        return test(arr)
    }
}

const processGridRtl = (option: GridComponentOption) => {
    // Swap right and left
    swapPosition(option)
}

const processLegendRtl = (option: LegendComponentOption) => {
    swapPosition(option)
    swapAlign(option, 'align', 'left')
}

const processToolboxRtl = (option: ToolboxComponentOption) => {
    swapPosition(option)
    const feature = option.feature || {}
    const newFeature: ToolboxComponentOption['feature'] = {}
    Object.entries(feature).reverse().forEach(([k, v]) => newFeature[k] = v)
    option.feature = newFeature
}

const processVisualMapRtl = (option: VisualMapComponentOption) => {
    swapPosition(option)
}

const processSeriesRtl = (option: SupportedSeriesOption, global: GlobalEcOption) => {
    if (option.type === 'pie') {
        processPieSeriesOption(option)
    } else if (option.type === 'line') {
        processLineSeriesOption(global)
    } else if (option.type === 'bar') {
        processBarSeriesOption(option, global)
    } else if (option.type === 'scatter') {
        // Let yAxis stay right
        processArrayLike(global.yAxis, yOpt => swapAlign(yOpt, 'position', 'left'))
        processArrayLike(global.xAxis, xOpt => xOpt.inverse = true)
    }
}

const processPieSeriesOption = (option: PieSeriesOption) => {
    const center = option.center
    if (!Array.isArray(center)) return
    const left = center[0]
    if (typeof left !== 'string' || !left.endsWith('%')) return
    try {
        const originPercentStr = left.substring(0, left.length - 1)
        const originPercent = left.includes('.') ? parseFloat(originPercentStr) : parseInt(originPercentStr)
        center[0] = `${100 - originPercent}%`
    } catch (ignored) { }
}

const processLineSeriesOption = (global: GlobalEcOption) => {
    processArrayLike(global.xAxis, xOpt => xOpt.inverse = true)
}

const processBarSeriesOption = (option: BarSeriesOption, global: GlobalEcOption) => {
    const isHorizontal = someArrayLike(global.xAxis, x => x?.type === 'value')
    if (isHorizontal) {
        // Let yAxis stay right
        processArrayLike(global.yAxis, yOpt => swapAlign(yOpt, 'position', 'left'))
    }
    // Swap border radius
    processArrayLike(option.data, data => processArrayLike(data, item => {
        if (!(typeof item === 'object')) return
        const { itemStyle: { borderRadius } = {} } = item as { itemStyle?: { borderRadius: number[] | any } }
        Array.isArray(borderRadius) && swapBorderRadius(borderRadius)
    }))
    // Inverse xAxis
    processArrayLike(global.xAxis, xOpt => xOpt.inverse = true)
}

type AlignVal = 'right' | 'left'
const swapAlign = <K extends string>(option: { [k in K]?: AlignVal | string }, key: K, defaultVal?: AlignVal) => {
    const { [key]: align = defaultVal } = option || {}
    if (align === 'left') {
        option[key] = 'right'
    } else if (align === 'right') {
        option[key] = 'left'
    }
}

const swapPosition = (option: { left?: string | number, right?: string | number }) => {
    const right = option.right
    option.right = option.left
    option.left = right
}

const swapBorderRadius = (option: number[]) => {
    if (option?.length !== 4) return

    let t = option[0]
    option[0] = option[1]
    option[1] = t
    t = option[2]
    option[2] = option[3]
    option[3] = t
}