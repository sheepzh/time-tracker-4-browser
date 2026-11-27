import { onMounted, onUnmounted } from 'vue'

export const useMounted = (callback: () => NoArgCallback | void) => {
    let cleanFunc: NoArgCallback | undefined
    onMounted(() => cleanFunc = callback() ?? undefined)
    onUnmounted(() => cleanFunc?.())
}