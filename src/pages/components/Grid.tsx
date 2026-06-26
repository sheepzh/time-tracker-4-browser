import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, toRef } from 'vue'
import { ALL_BASE_PROPS, cvt2BaseStyle, cvtPxScale, type BaseProps } from './common'

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

    let observer: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null

    onMounted(() => {
        nextTick(measure)

        observer = new ResizeObserver(measure)
        if (containerRef.value) observer.observe(containerRef.value)

        mutationObserver = new MutationObserver(measure)
        if (containerRef.value) mutationObserver.observe(containerRef.value, { childList: true })
    })

    onUnmounted(() => {
        observer?.disconnect()
        mutationObserver?.disconnect()
    })

    const placeholderCount = computed(() => {
        if (!columnCount.value || !childCount.value) return 0
        const remainder = childCount.value % columnCount.value
        return remainder === 0 ? 0 : columnCount.value - remainder
    })

    return {
        containerRef,
        columnCount,
        placeholderCount,
    }
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

const Grid = defineComponent<Props>((props, { slots }) => {
    const minColumnWidth = toRef(props, 'minColumnWidth', 200)
    const maxColumnWidth = toRef(props, 'maxColumnWidth', '1fr')
    const columnGap = computed(() => calcGridGap(props.columnGap))
    const rowGap = toRef(props, 'rowGap', 16)

    const { containerRef, placeholderCount } = useGridPlaceholder()

    return () => (
        <div
            ref={containerRef}
            id={props.id}
            class={props.class}
            onClick={props.onClick}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${cvtPxScale(minColumnWidth.value)}, ${cvtPxScale(maxColumnWidth.value)}))`,
                columnGap: columnGap.value,
                rowGap: cvtPxScale(rowGap.value),
                width: '100%',
                ...cvt2BaseStyle(props),
            }}
        >
            {slots.default?.()}
            {Array.from({ length: placeholderCount.value }, (_, idx) => (
                <i key={idx} data-grid-placeholder aria-hidden="true" style={{ height: 0, overflow: 'hidden' }} />
            ))}
        </div>
    )
}, {
    props: [...ALL_BASE_PROPS, 'columnGap', 'rowGap', 'minColumnWidth', 'maxColumnWidth']
})

export default Grid