import { shallowRef } from 'vue'
import { useWindowListener } from './useWindowListener'

export function useWindowSize() {
    const size = shallowRef({ w: Number.POSITIVE_INFINITY, h: Number.POSITIVE_INFINITY })

    const resize = () => {
        if (typeof window === 'undefined') return
        size.value = { w: window.innerWidth, h: window.innerHeight }
    }

    useWindowListener('resize', resize, { passive: true })
    resize()

    return size
}
