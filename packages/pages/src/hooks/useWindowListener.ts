import { onMounted } from 'vue'

export const useWindowListener = <K extends keyof WindowEventMap>(type: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions) => {
    if (typeof window === 'undefined') {
        return
    }

    onMounted(() => {
        window.addEventListener(type, listener, options)
        return () => window.removeEventListener(type, listener)
    })
}