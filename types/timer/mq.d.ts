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
        // @since 3.1.0
        | 'limitReminder'
        // @since 2.0.0
        | 'askVisitTime'
        | 'askHitVisit'
        // @since 3.2.0
        | 'siteRunChange'
        // @since 3.5.0
        | "enableTabGroup"
        // @since 3.7.3
        | "syncAudible"
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
        | "cs.trackRunTime"
        | "cs.onInjected"
        | "cs.openAnalysis"
        | "cs.openLimit"
        // @since 2.5.5
        | "cs.idleChange"
        // @since 3.2.0
        | "cs.getRunSites"
        // @since 3.6.1
        | "cs.timelineEv"
        // @since 3.7.3
        | "cs.getAudible"

    type ResCode = "success" | "fail" | "ignore"

    /**
     * @since 0.2.2
     */
    type Request<T = any> = {
        code: ReqCode
        data?: T
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
    type Handler<Req, Res> = (data: Req, sender: chrome.runtime.MessageSender) => Promise<Res> | Res
    /**
     * @since 0.8.4
     */
    type Callback<T = any> = (result?: Response<T>) => void
}