import { type ShallowRef, shallowRef } from 'vue'
import { useMounted } from './useMounted'

export function useDocumentVisibility(): Readonly<ShallowRef<DocumentVisibilityState>> {
    if (typeof document === 'undefined') return shallowRef('visible')

    const visibility = shallowRef(document.visibilityState)

    useMounted(() => {
        const listener = () => visibility.value = document.visibilityState
        document.addEventListener('visibilitychange', listener, { passive: true })
        return () => document.removeEventListener('visibilitychange', listener)
    })

    return visibility
}