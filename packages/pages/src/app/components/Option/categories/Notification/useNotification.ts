import { trySendMsg2Runtime } from '@api/sw/common'
import { defaultNotification } from '@util/constant/option'
import { computed, watch } from 'vue'
import { useOption } from '../../useOption'

function copy(target: timer.option.NotificationOption, source: timer.option.NotificationOption) {
    target.notificationCycle = source.notificationCycle
    target.notificationOffset = source.notificationOffset
    target.notificationMethod = source.notificationMethod
    target.notificationEndpoint = source.notificationEndpoint
    target.notificationAuthToken = source.notificationAuthToken
}

const MIN_PER_DAY = 24 * 60

export const useNotification = () => {
    const { option, loading } = useOption<timer.option.NotificationOption>({ defaultValue: defaultNotification, copy })

    watch([
        () => option.notificationCycle,
        () => option.notificationOffset,
    ], () => !loading.value && setTimeout(() => trySendMsg2Runtime('resetNotificationScheduler')))

    const weekday = computed<number | null>({
        get() {
            if (option.notificationCycle !== 'weekly') return null
            let offset = option.notificationOffset
            offset = Number.isNaN(offset) ? 0 : offset
            return Math.floor(offset / MIN_PER_DAY)
        },
        set(val) {
            if (option.notificationCycle !== 'weekly' || val === null) return
            const timeMinutes = option.notificationOffset % MIN_PER_DAY
            option.notificationOffset = val * MIN_PER_DAY + timeMinutes
        },
    })

    const datetime = computed<Date | null>({
        get() {
            if (option.notificationCycle === 'none') return null
            let offset = option.notificationOffset
            offset = Number.isNaN(offset) ? 0 : offset
            const hours = Math.floor(offset / 60)
            const minutes = offset % 60
            const date = new Date()
            date.setHours(hours, minutes, 0, 0)
            return date
        },
        set(val) {
            if (val === null || option.notificationCycle === 'none') return
            const hours = val.getHours()
            const minutes = val.getMinutes()
            const dateMinutes = hours * 60 + minutes

            if (option.notificationCycle === 'daily') {
                option.notificationOffset = dateMinutes
            } else if (option.notificationCycle === 'weekly') {
                option.notificationOffset = (weekday.value ?? 0) * MIN_PER_DAY + dateMinutes
            }
        },
    })

    const reset = () => {
        option.notificationCycle = defaultNotification().notificationCycle
        // other fields needn't be reset
    }

    return { option, weekday, datetime, reset }
}
