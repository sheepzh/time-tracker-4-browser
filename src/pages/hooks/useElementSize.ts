import { isRef, type MaybeRef, onMounted, onUnmounted, ref, unref, watch } from 'vue'
import { useDebounceFn } from './useDebounce'

type Options = {
    debounce?: number
}

type Target = MaybeRef<Element | null | undefined> | string

export function useElementSize(target: Target, options?: Options) {
    const { debounce = 0 } = options ?? {}

    const width = ref(0)
    const height = ref(0)

    let observer: ResizeObserver | undefined

    const getTargetElement = (): Element | null => {
        const el = unref(target) ?? null

        if (typeof el === 'string') {
            return document.querySelector(el)
        }

        return el
    }

    const updateSize = (entry: ResizeObserverEntry) => {
        if (entry.contentBoxSize?.[0]) {
            width.value = entry.contentBoxSize[0].inlineSize
            height.value = entry.contentBoxSize[0].blockSize
        } else {
            // fallback
            width.value = entry.contentRect.width
            height.value = entry.contentRect.height
        }
    }

    const debouncedUpdateSize = useDebounceFn(
        (entry: ResizeObserverEntry) => updateSize(entry),
        debounce
    )

    const handleResize: ResizeObserverCallback = (entries: ResizeObserverEntry[]) => {
        const entry = entries[0]
        if (!entry) return

        if (debounce > 0) {
            debouncedUpdateSize(entry)
        } else {
            updateSize(entry)
        }
    }

    const start = () => {
        if (observer) return

        const element = getTargetElement()
        if (!element) {
            console.warn('useElementSize: target element not found')
            return
        }

        try {
            observer = new ResizeObserver(handleResize)
            observer.observe(element, { box: 'content-box' })
        } catch (error) {
            console.error('useElementSize: filed to create observer', error)
        }
    }

    const stop = () => {
        if (!observer) return

        observer.disconnect()
        observer = undefined
    }

    onMounted(() => {
        if (!isRef(target)) {
            return start()
        }

        watch(
            () => getTargetElement(),
            (newEl, oldEl) => {
                if (newEl && newEl !== oldEl) {
                    stop()
                    start()
                }
            },
            { immediate: true }
        )
    })

    onUnmounted(stop)

    return { width, height }
}
