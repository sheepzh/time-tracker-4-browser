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
}