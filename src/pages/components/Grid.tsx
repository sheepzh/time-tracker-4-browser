import { useMounted } from '@hooks'
import { computed, defineComponent, nextTick, ref } from 'vue'
import { ALL_BASE_PROPS, cvtPxScale, wrapStyle, type BaseProps } from './common'

function useGridPlaceholder() {
    const containerRef = ref<HTMLElement>()
    const columnCount = ref(0)
    const childCount = ref(0)

    const measure = () => {
        if (!containerRef.value) return

        const columns = getComputedStyle(containerRef.value)
            .gridTemplateColumns
            .split(' ')
            .filter(Boolean).length
        columnCount.value = columns

        childCount.value = containerRef.value
            .querySelectorAll(':scope > *:not([data-grid-placeholder])')
            .length
    }

    useMounted(() => {
        nextTick(measure)

        const observer = new ResizeObserver(measure)
        if (containerRef.value) observer.observe(containerRef.value)
        const mutationObserver = new MutationObserver(measure)
        if (containerRef.value) mutationObserver.observe(containerRef.value, { childList: true })
        return () => {
            observer.disconnect()
            mutationObserver.disconnect()
        }
    })

    const placeholderCount = computed(() => {
        if (!columnCount.value || !childCount.value) return 0
        const remainder = childCount.value % columnCount.value
        return remainder === 0 ? 0 : columnCount.value - remainder
    })

    return { containerRef, columnCount, placeholderCount }
}

type Gap = number | string

type Props = {
    columnGap?: Gap | [Gap, Gap]
    rowGap?: number | string
    minColumnWidth?: number | string
    maxColumnWidth?: number | string
} & BaseProps

const calcGridGap = (val: Gap | [Gap, Gap] | undefined): string | undefined => {
    if (!val) return undefined
    return Array.isArray(val)
        ? `clamp(${cvtPxScale(val[0])}, 2vw, ${cvtPxScale(val[1])})`
        : cvtPxScale(val)
}

export default defineComponent<Props>((props, { slots }) => {
    const style = computed(() => {
        const { minColumnWidth = 200, maxColumnWidth = '1fr', rowGap = 16, columnGap } = props
        const style = wrapStyle(props, {
            gridTemplateColumns: `repeat(auto-fill, minmax(${cvtPxScale(minColumnWidth)}, ${cvtPxScale(maxColumnWidth)}))`,
            columnGap: calcGridGap(columnGap),
            rowGap: cvtPxScale(rowGap),
        })
        style.width ??= '100%'
        style.display = 'grid'
        return style
    })

    const { containerRef, placeholderCount } = useGridPlaceholder()

    return () => {
        const { id, class: cls, onClick } = props
        return <div id={id} ref={containerRef} class={cls} onClick={onClick} style={style.value}>
            {slots.default?.()}
            {Array.from({ length: placeholderCount.value }, (_, idx) => (
                <i key={idx} data-grid-placeholder aria-hidden="true" style={{ height: 0, overflow: 'hidden' }} />
            ))}
        </div>
    }
}, {
    props: [...ALL_BASE_PROPS, 'columnGap', 'rowGap', 'minColumnWidth', 'maxColumnWidth']
})