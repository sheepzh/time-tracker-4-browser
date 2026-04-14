declare namespace timer.timeline {
    type Event = {
        start: number
        end: number
        url: string
    }

    type Tick = {
        start: number
        duration: number
        host: string
    }

    type MergeMethod = 'cate' | 'domain' | 'none'

    type Activity = {
        start: number
        duration: number
        seriesKey: string
        seriesName: string | undefined
    }

    type Query = {
        host?: string
        start?: number
        merge: MergeMethod
    }
}
