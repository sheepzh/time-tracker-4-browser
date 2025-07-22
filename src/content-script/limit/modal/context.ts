import { useRequest } from "@hooks/useRequest"
import limitService from "@service/limit-service"
import { useWindowFocus } from "@vueuse/core"
import { type App, inject, provide, type Ref, ref, watch } from "vue"
import { type LimitReason } from "../common"

const REASON_KEY = "display_reason"
const RULE_KEY = "display_rule"
const DELAY_HANDLER_KEY = 'delay_handler'

export const provideReason = (app: App<Element>): Ref<LimitReason | undefined> => {
    const reason = ref<LimitReason>()
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
        const rules = await limitService.select({ id: reasonId, filterDisabled: false })
        return rules?.[0]
    })

    watch([reason, windowFocus], refresh)

    provide(RULE_KEY, rule)
}

export const useRule = () => inject(RULE_KEY) as Ref<timer.limit.Item | null>

export const provideDelayHandler = (app: App<Element>, handlers: () => void) => {
    app?.provide(DELAY_HANDLER_KEY, handlers)
}

export const useDelayHandler = () => inject(DELAY_HANDLER_KEY) as () => void