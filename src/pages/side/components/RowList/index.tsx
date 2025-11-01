import { css } from '@emotion/css'
import Flex from "@pages/components/Flex"
import { sum } from "@util/array"
import { ElEmpty, ElScrollbar, type ScrollbarInstance, useNamespace } from "element-plus"
import { computed, type CSSProperties, defineComponent, ref, toRef, watch } from "vue"
import Item from "./Item"

type Props = {
    data: timer.stat.Row[]
    loading?: boolean
    style?: CSSProperties
}

const RowList = defineComponent<Props>(props => {
    const data = toRef(props, 'data')
    const maxFocus = computed(() => data.value.map(r => r.focus).reduce((a, b) => a > b ? a : b, 0) ?? 0)
    const totalFocus = computed(() => sum(data.value.map(i => i?.focus ?? 0)))
    const scrollbar = ref<ScrollbarInstance>()
    watch(data, () => scrollbar.value?.setScrollTop(0))

    const emptyNs = useNamespace('empty')
    const emptyCls = css`
        & .${emptyNs.e('image')} {
            display: none !important;

            & .${emptyNs.e('description')} {
                margin-top: 0;
            }
        }
    `
    return () => (
        <Flex flex={1} style={props.style}>
            <ElScrollbar v-loading={props.loading} height="100%" ref={scrollbar} style={{ width: '100%' }}>
                <Flex column gap={8}>
                    {!data.value?.length && !props.loading && <ElEmpty class={emptyCls} />}
                    {data.value?.map(item => <Item value={item} max={maxFocus.value} total={totalFocus.value} />)}
                </Flex>
            </ElScrollbar>
        </Flex>
    )
}, { props: ['data', 'loading', 'style'] })

export default RowList