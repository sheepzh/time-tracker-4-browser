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
        /** Unix timestamp (ms) of row start */
        startTime: number
        /** Unix timestamp (ms) of row end */
        endTime: number
        /**
         * 1 - 60000
         * ps. 60000 = 60s * 1000ms/s
         */
        milliseconds: number
    }

    type Query = {
        range?: KeyRange
        size?: number
    }
}