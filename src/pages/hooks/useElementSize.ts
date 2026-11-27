import { type Ref, ref, watch } from 'vue'
import { useDebounceFn } from './useDebounce'

type Options = {
    debounce?: number
}

export function useElementSize(target: Ref<Element | undefined>, options?: Options) {
    const { debounce = 0 } = options ?? {}

    const size = ref({ w: 0, h: 0 })

    const updateSize = (entry?: ResizeObserverEntry) => {
        if (!entry) return
        const { contentBoxSize: [box], contentRect: rect } = entry
        const w = box?.inlineSize ?? rect.width
        const h = box?.blockSize ?? rect.height
        size.value = { w, h }
    }

    const onSize = debounce > 0 ? useDebounceFn(updateSize, debounce) : updateSize

    watch(target, (el, _, onCleanup) => {
        if (!el) return

        const observer = new ResizeObserver(entries => onSize(entries[0]))
        observer.observe(el, { box: 'content-box' })
        onCleanup(() => observer.disconnect())
    }, { immediate: true, flush: 'post' })

    return size
}
