import {
    createGist, findTarget, getJsonFileContent, updateGist,
    type FileForm, type GistForm,
} from "@api/gist"
import {
    init,
    type ComposeOption,
    type GridComponentOption, type LineSeriesOption, type TitleComponentOption
} from "echarts"
import { writeFileSync } from "fs"
import { exit } from 'process'
import { validateTokenFromEnv } from '../util/gist'
import { filenameOf, getExistGist, type Browser, type UserCount } from "./common"

type EcOption = ComposeOption<
    | LineSeriesOption
    | TitleComponentOption
    | GridComponentOption
>
const ALL_BROWSERS: Browser[] = ['edge', 'chrome', 'firefox']

type OriginData = Record<Browser, UserCount>

type ChartData = {
    xAxis: string[]
    yAxises: Record<Browser, number[]>
}

const VALID_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const parseDate = (date: string): Date => new Date(`${date}T00:00:00Z`)
const formatDate = (date: Date): string => date.toISOString().slice(0, 10)
const computeGrowth = (current: number, base: number | undefined): string => {
    if (!base) return '0'
    const growth = ((current - base) / base) * 100
    return growth > 0 ? `+${growth.toFixed(2)}` : growth.toFixed(2)
}

const computeSummary = ({ xAxis, yAxises }: ChartData) => {
    const totals = xAxis.map((_, idx) => ALL_BROWSERS.reduce((sum, browser) => sum + (yAxises[browser][idx] ?? 0), 0))
    const total = totals[totals.length - 1] ?? 0
    const latest = xAxis[xAxis.length - 1]
    if (!latest) return { total, yoy: '0', month: '0' }

    const latestDate = parseDate(latest)
    const lastYearDate = new Date(latestDate)
    lastYearDate.setUTCFullYear(lastYearDate.getUTCFullYear() - 1)
    const lastMonthDate = new Date(latestDate)
    lastMonthDate.setUTCMonth(lastMonthDate.getUTCMonth() - 1)

    const indexByDate = new Map(xAxis.map((date, idx) => [date, idx]))
    const yoyBase = totals[indexByDate.get(formatDate(lastYearDate)) ?? -1]
    const monthBase = totals[indexByDate.get(formatDate(lastMonthDate)) ?? -1]
    const yoy = computeGrowth(total, yoyBase)
    const month = computeGrowth(total, monthBase)

    return { total, yoy, month }
}

function preProcess(originData: OriginData): ChartData {
    // 1. sort dates
    const dateSet = new Set<string>()
    Object.values(originData).forEach(ud => Object.keys(ud).forEach(date => dateSet.add(date)))
    let allDates = Array.from(dateSet).filter(d => VALID_DATE_RE.test(d)).sort()

    // 2. smooth the count
    const ctx: Record<Browser, SmoothContext> = {
        chrome: new SmoothContext(),
        firefox: new SmoothContext(),
        edge: new SmoothContext(),
    }

    allDates.forEach(
        date => ALL_BROWSERS.forEach(b => ctx[b].process(originData[b][date]))
    )
    return {
        xAxis: allDates,
        yAxises: {
            chrome: ctx.chrome.end(),
            firefox: ctx.firefox.end(),
            edge: ctx.edge.end(),
        }
    }
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
            this.step += 1
        }
    }

    smooth(currentValue: number): void {
        if (this.step < 0) {
            return
        }
        const unitVal = (currentValue - this.lastVal) / (this.step + 1)

        const smoothedValues = Array.from({ length: this.step }, (_, i) => Math.floor(unitVal * (i + 1) + this.lastVal))
        this.data.push(...smoothedValues)
        this.data.push(currentValue)
        // Reset
        this.lastVal = currentValue
        this.step = 0
    }

    end(): number[] {
        Array.from({ length: this.step }).forEach(() => this.data.push(this.lastVal))
        return this.data
    }
}

function render2Svg(chartData: ChartData): string {
    const { xAxis, yAxises } = chartData
    const chart = init(null, null, {
        renderer: 'svg',
        ssr: true,
        width: 960,
        height: 640
    })
    const { total, yoy, month } = computeSummary(chartData)
    const ds = xAxis[0]
    const de = xAxis[xAxis.length - 1]
    const option: EcOption = {
        title: {
            text: 'Weekly Active Users',
            subtext: `${ds} to ${de}  |  currently ${total}  |  YoY ${yoy}%  |  MoM ${month}%`
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
    const result: OriginData = {
        chrome: {},
        firefox: {},
        edge: {},
    }
    for (const b of ALL_BROWSERS) {
        result[b] = await getDataFromGist(token, b)
    }
    return result
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
