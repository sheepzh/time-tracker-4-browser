import { computed, type ComputedRef, reactive } from 'vue'
import { useWindowListener } from './useWindowListener'

type KeyMatcher = KeyboardEvent['key'] | ((ev: KeyboardEvent) => boolean)

const matchKey = (matcher: KeyMatcher, ev: KeyboardEvent) => {
    return typeof matcher === 'function' ? matcher(ev) : ev.key === matcher
}

export const useKeyPressed = (...matcher: KeyMatcher[]): ComputedRef<boolean> => {
    const pressedKeys = reactive(new Set<string>())

    useWindowListener('keydown', ev => matcher.some(m => matchKey(m, ev)) && pressedKeys.add(ev.key))
    useWindowListener('keyup', ev => matcher.some(m => matchKey(m, ev)) && pressedKeys.delete(ev.key))
    useWindowListener('blur', () => pressedKeys.clear())

    return computed(() => pressedKeys.size > 0)
}

export const useHotKey = (matcher: KeyMatcher, handler: ArgCallback<KeyboardEvent>) => {
    useWindowListener('keydown', ev => {
        if (ev.defaultPrevented || ev.isComposing || ev.repeat) return
        if (!matchKey(matcher, ev)) return
        handler(ev)
    })
}