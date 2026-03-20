declare namespace timer.period {
    type Key = {
        year: number
        month: number
        date: number
        /**
         * 0~95
         * ps. 95 = 60 / 15 * 24 - 1
         */
        order: number
    }
    type KeyRange = [Key, Key]
    type Result = Key & {
        /**
         * 1~900000
         * ps. 900000 = 15min * 60s/min * 1000ms/s
         */
        milliseconds: number
    }
    type Row = {
        /**
         * {yyyy}{mm}{dd}
         */
        date: string
        startTime: Date
        endTime: Date
        /**
         * 1 - 60000
         * ps. 60000 = 60s * 1000ms/s
         */
        milliseconds: number
    }

    type MergeConfig = {
        start: Key
        end: Key
        periodSize: number
    }

    type MergeRequest = {
        periods: Result[]
        config: MergeConfig
    }
}