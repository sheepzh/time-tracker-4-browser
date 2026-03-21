import { onScopeDispose, ref, Ref, watch } from 'vue'

type CountDownOptions = {
    countdown: number
    onComplete?: NoArgCallback
    onTick?: ArgCallback<number>
}

export const useCountDown = (option: CountDownOptions): NoArgCallback => {
    const { countdown, onComplete, onTick } = option

    const start = Date.now()
    let left = countdown * 1000

    const timer = setInterval(() => {
        left = Math.max(start + countdown * 1000 - Date.now(), 0)
        onTick?.(left)
        if (!left) {
            onComplete?.()
            clearInterval(timer)
        }
    }, 100)

    return () => clearInterval(timer)
}

type CountUpOptions = {
    value: Ref<number>
    duration?: number
    onFinish?: NoArgCallback
}

export const useCountUp = (options: CountUpOptions) => {
    const { value, duration = 2, onFinish } = options
    const current = ref(0)
    let raf: number | null = null
    let startTime: number | null = null
    let lastUpdate = 0

    const clear = (): void => {
        if (!raf) return
        cancelAnimationFrame(raf)
        raf = null
    }

    const animate = (ts: number): void => {
        if (!raf) return

        if (ts - lastUpdate < 50) {
            raf = requestAnimationFrame(animate)
            return
        }
        lastUpdate = ts

        if (startTime === null) startTime = ts

        const elapsed = ts - startTime
        const progress = Math.min(elapsed / (duration * 1000), 1)
        const ease = 1 - (1 - progress) ** 3

        const target = Math.round(value.value)
        const start = Math.round(current.value)
        current.value = Math.round(start + (target - start) * ease)

        if (progress >= 1) {
            current.value = target
            onFinish?.()
            raf = null
            return
        }

        raf = requestAnimationFrame(animate)
    }

    watch(value, () => {
        clear()
        lastUpdate = 0
        raf = requestAnimationFrame(animate)
    }, { immediate: true })

    onScopeDispose(clear)

    return { current, clear }
}