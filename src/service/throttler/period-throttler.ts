import periodDatabase from '@db/period-database'
import { calculate } from '@service/components/period-calculator'
import { FirefoxThrottler } from './firefox-throttler'

class PeriodThrottler extends FirefoxThrottler<timer.period.Result> {
    public add(timestamp: number, milliseconds: number): void {
        const results = calculate(timestamp, milliseconds)
        this.save(results)
    }

    protected doStore(data: timer.period.Result[]): void {
        periodDatabase.accumulate(data)
    }
}

const periodThrottler = new PeriodThrottler()

export default periodThrottler