import { onMounted, onUnmounted } from 'vue'

type MountedCallback = () => void | Promise<void> | (() => void | Promise<void>)

export const useMounted = (callback: MountedCallback) => {
    onMounted(() => {
        const cleanup = callback()
        if (typeof cleanup === 'function') onUnmounted(() => cleanup())
    })
}