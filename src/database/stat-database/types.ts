
export type StatCondition = {
    /**
     * Date
     * {y}{m}{d}
     */
    date?: Date | [Date?, Date?]
    /**
     * Focus range, milliseconds
     *
     * @since 0.0.9
     */
    focusRange?: Vector<2>
    /**
     * Time range
     *
     * @since 0.0.9
     */
    timeRange?: [number, number?]
    /**
     * Whether to include virtual sites
     *
     * @since 1.6.1
     */
    virtual?: boolean
    /**
     * Host or groupId, full match
     */
    keys?: string[] | string
}

export interface StatDatabase {
    get(host: string, date: Date | string): Promise<timer.core.Row>
    select(condition?: StatCondition): Promise<timer.core.Row[]>
    /**
     * Accumulate data
     */
    accumulate(host: string, date: Date | string, item: timer.core.Result): Promise<timer.core.Result>
    batchAccumulate(data: Record<string, timer.core.Result>, date: Date | string): Promise<Record<string, timer.core.Result>>
    delete(...rows: timer.core.RowKey[]): Promise<void>
    /**
     * Delete by host
     *
     * @param host host
     * @param range date range, inclusive start and end, if null, delete all
     */
    deleteByHost(host: string, range?: [start?: Date | string, end?: Date | string]): Promise<string[]>

    /******* GROUP *******/
    /**
     * Accumulate data for tab group
     */
    accumulateGroup(groupId: number, date: Date | string, item: timer.core.Result): Promise<timer.core.Result>
    selectGroup(condition?: StatCondition): Promise<timer.core.Row[]>
    deleteGroup(...rows: [groupId: number, date: string][]): Promise<void>
    /**
     * Delete group data
     *
     * @param groupId the id of group
     * @param range date range, inclusive start and end, if null, delete all
     */
    deleteByGroup(groupId: number, range?: [start?: Date | string, end?: Date | string]): Promise<void>

    /**
     * Force update data with overwriting
     */
    forceUpdate(...rows: timer.core.Row[]): Promise<void>

    /**
     * Force update group data with overwriting
     */
    forceUpdateGroup(...rows: timer.core.Row[]): Promise<void>
}