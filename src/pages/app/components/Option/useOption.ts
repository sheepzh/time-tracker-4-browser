import { useRequest } from '@hooks/useRequest'
import optionHolder from "@service/components/option-holder"
import { reactive, toRaw, watch } from "vue"

type Options<T> = {
    defaultValue: () => T
    copy: (target: T, source: T) => void
    onChange?: (newVal: T) => void
}

export const useOption = <T extends object = Partial<timer.option.AllOption>>(options: Options<T>) => {
    const { defaultValue, copy, onChange } = options
    const option = reactive<T>(defaultValue?.())

    const { loading } = useRequest(async () => {
        const currentVal = await optionHolder.get() as T
        copy(option as T, currentVal)
    })

    watch(option, async () => {
        const newVal = toRaw(option) as T
        !loading.value && await optionHolder.set(newVal)
        onChange?.(newVal)
    })

    return { option, loading }
}