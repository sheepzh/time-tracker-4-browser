import { useMounted } from './useMounted'

export const useWindowListener = <K extends keyof WindowEventMap>(type: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions) => {
    if (typeof window === 'undefined') return
    useMounted(() => {
        window.addEventListener(type, listener, options)
        return () => window.removeEventListener(type, listener)
    })
}