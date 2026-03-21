import { getCssVariable } from "@pages/style"
import { range } from "@util/array"
import { addVector, multiTuple, subVector } from "@util/tuple"
import { type LinearGradientObject } from "echarts"

const splitVectors = (vectorRange: Tuple<Vector<number>, 2>, count: number, gradientFactor?: number): Vector<number>[] => {
    gradientFactor = gradientFactor ?? 1.3
    const segmentCount = count - 1
    const [v1, v2] = vectorRange
    const delta = subVector(v2, v1)
    const allVectors = range(segmentCount).map(idx => {
        const growth = Math.pow(idx / count, gradientFactor)
        return addVector(v1, multiTuple(delta, growth))
    })
    allVectors.push(v2)
    return allVectors
}

export const getStepColors = (count: number, gradientFactor?: number): string[] => {
    const p1 = getCssVariable('--echarts-step-color-1') ?? ''
    const p2 = getCssVariable('--echarts-step-color-2') ?? ''
    if (!p1 || !p2) return [p1, p2].filter(s => !!s)

    if (count <= 0) return []
    if (count === 1) return [p1]
    if (count === 2) return [p1, p2]

    const c1 = cvtColor2Vector(p1)
    const c2 = cvtColor2Vector(p2)
    const allVectors = splitVectors([c1, c2], count, gradientFactor)
    return allVectors.map(([r, g, b]) => `rgb(${r.toFixed(1)}, ${g.toFixed(1)}, ${b.toFixed(1)})`)
}

/**
 * #ffffff => [255,255,255]
 */
const cvtColor2Vector = (color: string): Vector<3> => {
    return [color.substring(1, 3), color.substring(3, 5), color.substring(5, 7)]
        .map(c => parseInt('0x' + c)) as [number, number, number]
}

export const getSeriesPalette = (): string[] => {
    return range(4)
        .map(idx => `--echarts-series-color-${idx + 1}`)
        .map(val => getCssVariable(val))
        .filter(s => !!s) as string[]
}

const linearGradientColor = (color1: string, color2: string): LinearGradientObject => ({
    type: "linear",
    x: 0, y: 0,
    x2: 0, y2: 1,
    colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
    ],
})

export const getLineSeriesPalette = (): Tuple<LinearGradientObject, 3> => {
    return [
        linearGradientColor('#37A2FF', '#7415DB'),
        linearGradientColor('#FF0087', '#87009D'),
        linearGradientColor('#FFD600', '#DEAD00'),
    ]
}

export const getCompareColor = (): [string?, string?] => {
    return [
        getCssVariable('--echarts-compare-color-1'),
        getCssVariable('--echarts-compare-color-2'),
    ]
}

export const getDiffColor = (): [incColor?: string, decColor?: string] => {
    return [
        getCssVariable('--echarts-increase-color'),
        getCssVariable('--echarts-decrease-color'),
    ]
}

export const tooltipDot = (color: string) => {
    return `<div style="display:inline-block; background-color: ${color}; width: 8px; height: 8px; border-radius: 4px; margin-top: 1px; margin-bottom: 1px;"></div>`
}

export const tooltipFlexLine = (left: string, right: string, gap?: number): string => {
    gap = gap ?? 20
    return `
        <div style="display: flex; justify-content: space-between; margin: 0px; gap: ${gap}px">
            <span>
                ${left}
            </span>
            <span style="">
                ${right}
            </span>
        </div>
    `
}

export const tooltipSpaceLine = (height?: number): string => {
    height = height ?? 4
    return `<div style="width: 100%; height: ${height}px; background-color: transparent"></div>`
}

export const getPieBorderColor = (): string | undefined => {
    return getCssVariable('--echarts-pie-border-color')
}