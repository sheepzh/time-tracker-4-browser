import { onMounted, type ShallowRef, shallowRef } from 'vue'

export function useDocumentVisibility(): Readonly<ShallowRef<DocumentVisibilityState>> {
    if (typeof document === 'undefined') return shallowRef('visible')

    const visibility = shallowRef(document.visibilityState)

    onMounted(() => {
        const listener = () => visibility.value = document.visibilityState
        document.addEventListener('visibilitychange', listener, { passive: true })
        return () => document.removeEventListener('visibilitychange', listener)
    })

    return visibility
}