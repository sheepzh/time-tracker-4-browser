/**
* Message queue
*/
declare namespace timer.mq {
    type ReqCode =
        | 'openLimitPage'
        | 'limitTimeMeet'
        // @since 0.9.0
        | 'limitWaking'
        // @since 1.2.3
        | 'limitChanged'
        // @since 2.0.0
        | 'askVisitTime'
        | 'askHitVisit'
        // Request by content script
        // @since 1.3.0
        | "cs.isInWhitelist"
        | "cs.incVisitCount"
        | "cs.printTodayInfo"
        | "cs.getTodayInfo"
        | "cs.moreMinutes"
        | "cs.getLimitedRules"
        | "cs.getRelatedRules"
        | "cs.trackTime"
        | "cs.onInjected"
        | "cs.openAnalysis"
        | "cs.openLimit"
        // @since 2.5.5
        | "cs.idleChange"

    type ResCode = "success" | "fail" | "ignore"

    /**
     * @since 0.2.2
     */
    type Request<T = any> = {
        code: ReqCode
        data: T
    }
    /**
     * @since 0.8.4
     */
    type Response<T = any> = {
        code: ResCode,
        msg?: string
        data?: T
    }
    /**
     * @since 1.3.0
     */
    type Handler<Req, Res> = (data: Req, sender?: chrome.runtime.MessageSender) => Promise<Res> | Res
    /**
     * @since 0.8.4
     */
    type Callback<T = any> = (result?: Response<T>) => void
}