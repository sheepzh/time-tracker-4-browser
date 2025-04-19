import { t } from "@app/locale"
import { useProvide, useProvider } from "@hooks/useProvider"
import { range } from "@util/array"
import { ElMessage } from "element-plus"
import { type Reactive, reactive, ref, toRaw } from "vue"

type Step = 0 | 1 | 2

type SopData = Required<Omit<timer.limit.Rule, 'id'>>

type Context = {
    data: Reactive<SopData>
}

const createInitial = (): SopData => ({
    name: '',
    time: 3600,
    weekly: 0,
    cond: [],
    visitTime: 0,
    periods: [],
    enabled: true,
    weekdays: range(7),
    count: 0,
    weeklyCount: 0,
    allowDelay: false,
    locked: false,
})

type Options = {
    onSave?: (data: SopData) => void
}

const NAMESPACE = 'limit_sop_model'

export const initSop = ({ onSave }: Options) => {
    const step = ref<Step>(0)
    const data = reactive<SopData>(createInitial())

    const validator: Record<Step, () => Promise<boolean>> = {
        0: async () => {
            const nameVal = data.name?.trim?.()
            const weekdaysVal = data.weekdays
            if (!nameVal) {
                ElMessage.error("Name is empty")
                return false
            } if (!weekdaysVal?.length) {
                ElMessage.error("Effective days are empty")
                return false
            }
            return true
        },
        1: async () => {
            if (!data.cond?.length) {
                ElMessage.error(t(msg => msg.limit.message.noUrl))
                return false
            }
            return true
        },
        2: async () => {
            const { time, count, weekly, weeklyCount, visitTime, periods } = data
            if (true
                && !time && !count
                && !weekly && !weeklyCount
                && !visitTime && !periods?.length
            ) {
                ElMessage.error(t(msg => msg.limit.message.noRule))
                return false
            }
            return true
        },
    }

    const reset = (rule?: timer.limit.Rule) => {
        const rawRule = rule ? toRaw(rule) : createInitial()
        Object.entries(rawRule).forEach(([k, v]) => (data as any)[k] = v)
        step.value = 0
    }

    const handleNext = async () => {
        const stepVal = step.value
        const isValid = await validator[stepVal]?.()
        if (isValid) {
            stepVal === 2 ? onSave?.(toRaw(data)) : step.value++
        }
    }

    useProvide<Context>(NAMESPACE, { data })

    return {
        step, reset, handleNext
    }
}

export const useSopData = () => useProvider<Context, 'data'>(NAMESPACE, 'data').data