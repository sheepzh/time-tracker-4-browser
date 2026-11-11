import { getOption, setOption } from "@api/sw/option"
import { useRequest } from '@hooks'
import { reactive, toRaw, watch } from "vue"

type Options<T> = {
    defaultValue: T
    copy: (target: T, source: Readonly<T>) => void
    onChange?: (newVal: T) => void
}

export const useOption = <T extends object = Partial<tt4b.option.AllOption>>(options: Options<T>) => {
    const { defaultValue, copy, onChange } = options
    const option = reactive(structuredClone(defaultValue))

    const { loading } = useRequest(async () => {
        const currentVal = await getOption() as T
        copy(option as T, currentVal)
    })

    watch(option, async () => {
        const newVal = toRaw(option) as T
        !loading.value && await setOption(newVal)
        onChange?.(newVal)
    })

    return { option, loading }
}