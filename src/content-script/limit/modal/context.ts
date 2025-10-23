import { useRequest } from '@hooks/useRequest'
import { useWindowFocus } from '@hooks/useWindowFocus'
import { selectLimitItems } from "@service/limit-service"
import { type App, inject, provide, type Ref, shallowRef, watch } from "vue"
import { type LimitReason } from "../common"

const REASON_KEY = "display_reason"
const RULE_KEY = "display_rule"
const GLOBAL_KEY = "delay_global"
const DELAY_HANDLER_KEY = 'delay_handler'

type GlobalParam = {
    url: string
}

export const provideGlobalParam = (app: App<Element>, gp: GlobalParam) => {
    app.provide(GLOBAL_KEY, gp)
}

export const useGlobalParam = () => inject(GLOBAL_KEY) as GlobalParam

export const provideReason = (app: App<Element>): Ref<LimitReason | undefined> => {
    const reason = shallowRef<LimitReason>()
    app.provide(REASON_KEY, reason)
    return reason
}

export const useReason = () => inject(REASON_KEY) as Ref<LimitReason | undefined>

export const provideRule = () => {
    const reason = useReason()
    const windowFocus = useWindowFocus()

    const { data: rule, refresh } = useRequest(async () => {
        if (!windowFocus.value) return null
        const reasonId = reason.value?.id
        if (!reasonId) return null
        const rules = await selectLimitItems({ id: reasonId, filterDisabled: false })
        return rules?.[0]
    })

    watch([reason, windowFocus], refresh)

    provide(RULE_KEY, rule)
}

export const useRule = () => inject(RULE_KEY) as Ref<timer.limit.Item | null>

export const provideDelayHandler = (app: App<Element>, handlers: ArgCallback<number>) => {
    app?.provide(DELAY_HANDLER_KEY, handlers)
}

export const useDelayHandler = () => inject(DELAY_HANDLER_KEY) as ArgCallback<number>