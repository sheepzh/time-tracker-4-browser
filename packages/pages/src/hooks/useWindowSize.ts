import { onMounted, shallowRef } from 'vue'
import { useWindowListener } from './useWindowListener'

export function useWindowSize() {
    const width = shallowRef(Number.POSITIVE_INFINITY)
    const height = shallowRef(Number.POSITIVE_INFINITY)

    const update = () => {
        if (typeof window === 'undefined') return
        width.value = window.innerWidth
        height.value = window.innerHeight
    }

    update()
    onMounted(update)

    useWindowListener('resize', update, { passive: true })

    return { width, height }
}
