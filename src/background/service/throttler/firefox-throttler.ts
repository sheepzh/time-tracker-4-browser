import { IS_FIREFOX } from '@util/constant/environment'
import { MILL_PER_SECOND } from '@util/time'

const DEFAULT_INTERVAL = 30

export abstract class FirefoxThrottler<T> {
    private data: T[] = []

    constructor(intervalSec?: number) {
        if (!IS_FIREFOX) {
            return
        }

        // it's safety to use setInterval with 60sec interval
        // bcz the sw will be unloaded if no events in 10 minutes
        intervalSec = Math.min(intervalSec ?? DEFAULT_INTERVAL, 60)

        setInterval(() => {
            const toSave = [...this.data]
            this.data = []
            if (!toSave.length) return
            this.doStore(toSave)
        }, intervalSec * MILL_PER_SECOND)
    }

    private throttle(data: T[]): void {
        this.data.push(...data)
    }

    protected abstract doStore(data: T[]): void

    protected save(data: T[]): void {
        IS_FIREFOX ? this.throttle(data) : this.doStore(data)
    }
}