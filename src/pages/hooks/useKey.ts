import { computed, type ComputedRef, onBeforeUnmount, onMounted, reactive } from 'vue'

type KeyMatcher = KeyboardEvent['key'] | ((ev: KeyboardEvent) => boolean)

const matchKey = (matcher: KeyMatcher, ev: KeyboardEvent) => {
    return typeof matcher === 'function' ? matcher(ev) : ev.key === matcher
}

export const useKeyPressed = (...matcher: KeyMatcher[]): ComputedRef<boolean> => {
    const pressedKeys = reactive(new Set<string>())
    const pressed = computed(() => pressedKeys.size > 0)

    const handleKeydown = (ev: KeyboardEvent) => matcher.some(m => matchKey(m, ev)) && pressedKeys.add(ev.key)
    const handleKeyup = (ev: KeyboardEvent) => matcher.some(m => matchKey(m, ev)) && pressedKeys.delete(ev.key)
    const reset = () => pressedKeys.clear()

    onMounted(() => {
        window.addEventListener('keydown', handleKeydown)
        window.addEventListener('keyup', handleKeyup)
        window.addEventListener('blur', reset)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeydown)
        window.removeEventListener('keyup', handleKeyup)
        window.removeEventListener('blur', reset)
    })

    return pressed
}

export const useHotKey = (matcher: KeyMatcher, handler: ArgCallback<KeyboardEvent>) => {
    const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.defaultPrevented || ev.isComposing || ev.repeat) return
        if (!matchKey(matcher, ev)) return
        handler(ev)
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeyDown)
    })
}