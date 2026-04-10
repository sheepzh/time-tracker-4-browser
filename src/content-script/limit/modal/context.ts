import { selectLimits } from "@api/sw/limit"
import { useRequest, useWindowFocus } from '@hooks'
import { type App, inject, provide, ref, type ShallowRef, watch } from "vue"
import { ModalBridge } from './bridge'
import type { LimitReasonData } from './types'

const GLOBAL_KEY = "global"
const RULE_KEY = 'rule'

type AppContext = {
    reason: ShallowRef<LimitReasonData | undefined>
    visitTime: ShallowRef<number>
    bridge: ModalBridge
    url: string
}

export const provideApp = (app: App<Element>, bridge: ModalBridge, url: string) => {
    const reason = ref<LimitReasonData | undefined>()
    const visitTime = ref(0)

    bridge.register('reason', async data => { reason.value = data })

    const _unmount = app.unmount.bind(app)
    app.unmount = () => {
        bridge.dispose()
        _unmount()
    }

    const updateVisitTime = async () => {
        bridge.request('visitTime', undefined)
            .then(val => visitTime.value = val)
            .catch(() => visitTime.value = 0)
    }

    watch(reason, updateVisitTime, { immediate: true })
    window.setInterval(updateVisitTime, 1000)

    app.provide<AppContext>(GLOBAL_KEY, { reason, visitTime, bridge, url })
}

export const useApp = () => inject(GLOBAL_KEY) as AppContext

export const provideRule = () => {
    const { reason } = useApp()
    const windowFocus = useWindowFocus()

    const { data: rule, refresh } = useRequest(async () => {
        if (!windowFocus.value) return undefined
        const reasonId = reason.value?.id
        if (!reasonId) return undefined
        const rules = await selectLimits({ id: reasonId, filterDisabled: false })
        return rules?.[0]
    })

    watch([reason, windowFocus], refresh)

    provide(RULE_KEY, rule)
}

export const useRule = () => inject<ShallowRef<timer.limit.Item | undefined>>(RULE_KEY) as ShallowRef<timer.limit.Item | undefined>