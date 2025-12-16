import {
    createGist, findTarget, getJsonFileContent, updateGist,
    type FileForm, type GistForm,
} from "@api/gist"
import {
    init,
    type ComposeOption, type EChartsType, type GridComponentOption, type LineSeriesOption, type TitleComponentOption,
} from "echarts"
import { writeFileSync } from "fs"
import { exit } from 'process'
import { filenameOf, getExistGist, validateTokenFromEnv } from "./common"

type EcOption = ComposeOption<
    | LineSeriesOption
    | TitleComponentOption
    | GridComponentOption
>

const ALL_BROWSERS: Browser[] = ['firefox', 'chrome', 'edge']

const POINT_COUNT = 500

type OriginData = {
    [browser in Browser]: UserCount
}

type ChartData = {
    xAxis: string[]
    yAxises: {
        [browser in Browser]: number[]
    }
}

function preProcess(originData: OriginData): ChartData {
    // 1. sort dates
    const dateSet = new Set<string>()
    Object.values(originData).forEach(ud => Object.keys(ud).forEach(date => dateSet.add(date)))
    let allDates = Array.from(dateSet).sort()

    // 2. smooth the count
    const ctx: { [browser in Browser]: SmoothContext } = {
        chrome: new SmoothContext(),
        firefox: new SmoothContext(),
        edge: new SmoothContext(),
    }

    allDates.forEach(
        date => ALL_BROWSERS.forEach(b => ctx[b].process(originData[b][date]))
    )
    const result: ChartData = {
        xAxis: allDates,
        yAxises: {
            chrome: ctx.chrome.end(),
            firefox: ctx.firefox.end(),
            edge: ctx.edge.end(),
        }
    }

    // 3. zoom
    const reduction = Math.floor(Object.keys(allDates).length / POINT_COUNT)
    result.xAxis = zoom(result.xAxis, reduction)
    ALL_BROWSERS.forEach(b => result.yAxises[b] = zoom(result.yAxises[b], reduction))
    return result
}

class SmoothContext {
    lastVal: number
    step: number
    data: number[]

    constructor() {
        this.lastVal = 0
        this.step = 0
        this.data = []
    }

    /**
     * Process value
     */
    process(newVal: number | undefined) {
        if (newVal) {
            this.smooth(newVal)
        } else {
            this.increaseStep()
        }
    }

    smooth(currentValue: number): void {
        if (this.step < 0) {
            return
        }
        const unitVal = (currentValue - this.lastVal) / (this.step + 1)
        Object.keys(Array.from(new Array(this.step)))
            .map(key => parseInt(key))
            .map(i => Math.floor(unitVal * (i + 1) + this.lastVal))
            .forEach(smoothedVal => this.data.push(smoothedVal))
        this.data.push(currentValue)
        // Reset
        this.lastVal = currentValue
        this.step = 0
    }

    increaseStep(): void {
        this.step += 1
    }

    end(): number[] {
        Object.keys(Array.from(new Array(this.step)))
            .forEach(() => this.data.push(this.lastVal))
        return this.data
    }
}

function zoom<T>(data: T[], reduction: number): T[] {
    let i = 0
    const newData: T[] = []
    while (i < data.length) {
        newData.push(data[i])
        i += reduction
    }
    return newData
}

function render2Svg(chartData: ChartData): string {
    const { xAxis, yAxises } = chartData
    const chart: EChartsType = init(null, null, {
        renderer: 'svg',
        ssr: true,
        width: 960,
        height: 640
    })
    const totalUserCount = Object.values(yAxises)
        .map(v => v[v.length - 1] || 0)
        .reduce((a, b) => a + b)
    const option: EcOption = {
        title: {
            text: 'Total Active User Count',
            subtext: `${xAxis[0]} to ${xAxis[xAxis.length - 1]}  |  currently ${totalUserCount} `
        },
        legend: { data: ALL_BROWSERS },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '8%',
            containLabel: true
        },
        xAxis: { type: 'time' },
        yAxis: {
            type: 'value',
            minInterval: 100,
            axisLabel: {
                formatter(value) {
                    const text = value.toString()
                    const textLen = text.length
                    return textLen < 4 ? text : text.substring(0, textLen - 3) + 'K'
                },
            },
        },
        series: ALL_BROWSERS.map(b => ({
            name: b,
            type: 'line',
            stack: 'Total',
            // Fill the area
            areaStyle: {},
            lineStyle: { width: 0 },
            showSymbol: false,
            data: yAxises[b].map((val, idx) => [xAxis[idx], val]),
        }))
    }
    chart.setOption(option)
    return chart.renderToSVGString()
}

const USER_COUNT_GIST_DESC = "User count of timer, auto-generated"
const USER_COUNT_SVG_FILE_NAME = "user_count.svg"

async function getOriginData(token: string): Promise<OriginData> {
    const [firefox, edge, chrome]: UserCount[] = await Promise.all(
        ALL_BROWSERS.map(b => getDataFromGist(token, b))
    )
    return { chrome, firefox, edge }
}

/**
 * Get the data from gist
 */
async function getDataFromGist(token: string, browser: Browser): Promise<UserCount> {
    const gist = await getExistGist(token, browser)
    const file = gist?.files[filenameOf(browser)]
    return (file && await getJsonFileContent<UserCount>(file)) ?? {}
}

/**
 * Upload svg string to gist
 */
async function upload2Gist(token: string, svg: string) {
    const files: Record<string, FileForm> = {}
    files[USER_COUNT_SVG_FILE_NAME] = {
        filename: USER_COUNT_SVG_FILE_NAME,
        content: svg
    }
    const form: GistForm = {
        public: true,
        description: USER_COUNT_GIST_DESC,
        files
    }
    const gist = await findTarget(token, gist => gist.description === USER_COUNT_GIST_DESC)
    if (gist) {
        await updateGist(token, gist.id, form)
        console.log('Updated gist')
    } else {
        await createGist(token, form)
        console.log('Created new gist')
    }
}

async function main(): Promise<void> {
    const token = validateTokenFromEnv()
    // 1. get all data
    const originData: OriginData = await getOriginData(token)
    // 2. pre-process data
    const chartData = preProcess(originData)
    // 3. render csv
    const svg = render2Svg(chartData)
    writeFileSync('user-chart.svg', svg, 'utf-8')
    // 4. upload
    await upload2Gist(token, svg)
    // 5. finish
    exit()
}

main()
