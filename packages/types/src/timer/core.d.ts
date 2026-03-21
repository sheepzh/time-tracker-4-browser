declare namespace timer.core {
    type Event = {
        start: number
        end: number
        url: string
        ignoreTabCheck: boolean
        /**
         * Used for run time tracking
         */
        host?: string
    }

    /**
     * The dimension to statistics
     */
    type Dimension =
        // Focus time
        | 'focus'
        // Visit count
        | 'time'
        // Run time
        | 'run'

    /**
     * The stat result of host
     *
     * @since 0.0.1
     */
    type Result = MakeOptional<{ [item in Dimension]: number }, 'run'>

    /**
     * The unique key of each data row
     */
    type RowKey = {
        host: string
        date: string
    }

    type Row = RowKey & Result
}