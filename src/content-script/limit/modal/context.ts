import { listLimits } from "@api/sw/limit"
import { getOption } from '@api/sw/option'
import { useDocumentVisibility, useRequest } from '@hooks'
import { type App, inject, provide, ref, type Ref, type ShallowRef, watch } from "vue"
import { ModalBridge } from './bridge'
import type { LimitReasonData } from './types'

const GLOBAL_KEY = "global"
const RULE_KEY = 'rule'

type AppContext = {
    reason: ShallowRef<LimitReasonData | undefined>
    visitTime: ShallowRef<number>
    bridge: ModalBridge
    url: string
    delayDuration: Ref<number>
}

export const provideApp = (app: App<Element>, bridge: ModalBridge, url: string) => {
    const reason = ref<LimitReasonData | undefined>()
    const visitTime = ref(0)
    const delayDuration = ref(5)
    getOption().then(({ limitDelayDuration }) => delayDuration.value = limitDelayDuration).catch(() => { })

    bridge.register('reason', data => { reason.value = data })

    const updateVisitTime = async () => {
        bridge.request('visitTime', undefined)
            .then(val => visitTime.value = val)
            .catch(() => visitTime.value = 0)
    }

    watch(reason, updateVisitTime, { immediate: true })
    const intervalId = window.setInterval(updateVisitTime, 1000)

    const _unmount = app.unmount.bind(app)
    app.unmount = () => {
        bridge.dispose()
        clearInterval(intervalId)
        _unmount()
    }

    app.provide<AppContext>(GLOBAL_KEY, { reason, visitTime, bridge, url, delayDuration })
}

export const useApp = () => inject(GLOBAL_KEY) as AppContext

export const provideRule = () => {
    const { reason } = useApp()
    const visibility = useDocumentVisibility()

    const { data: rule, refresh } = useRequest(async () => {
        if (visibility.value !== 'visible') return undefined
        const reasonId = reason.value?.id
        if (!reasonId) return undefined
        const rules = await listLimits({ id: reasonId })
        return rules[0] ?? undefined
    })

    watch([reason, visibility], refresh)

    provide(RULE_KEY, rule)
}

export const useRule = () => inject<ShallowRef<timer.limit.Item | undefined>>(RULE_KEY) as ShallowRef<timer.limit.Item | undefined>