import { shallowRef, type ShallowRef } from 'vue'
import { useWindowListener } from './useWindowListener'

export function useWindowFocus(): ShallowRef<boolean> {
    if (typeof window === 'undefined') return shallowRef(false)

    const focused = shallowRef(window.document.hasFocus())

    const options: AddEventListenerOptions = { passive: true }

    useWindowListener('focus', () => focused.value = true, options)
    useWindowListener('blur', () => focused.value = false, options)

    return focused
}