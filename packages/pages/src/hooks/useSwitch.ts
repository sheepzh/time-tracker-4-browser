import { type Ref, ref } from "vue"

type Result = [
    ref: Ref<boolean>,
    open: () => void,
    close: () => void,
    toggle: () => void,
]

export const useSwitch = (defaultValue?: boolean): Result => {
    const value = ref(defaultValue || false)
    const open = () => value.value = true
    const close = () => value.value = false
    const toggle = () => value.value ? close() : open()
    return [value, open, close, toggle]
}