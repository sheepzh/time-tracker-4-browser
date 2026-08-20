import { More } from '@element-plus/icons-vue'
import Flex from '@pages/components/Flex'
import { ElButton, ElScrollbar, useLocale } from 'element-plus'
import { CSSProperties, FunctionalComponent } from 'vue'

type Props = {
    minWidth?: number
    loading?: boolean
    end?: boolean
    loadMore?: NoArgCallback
}

const useViewStyle = (minWidth: number) => ({
    width: "100%",
    display: 'grid',
    gap: '.6em',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
} satisfies CSSProperties)

const NO_MORE_STYLE: CSSProperties = {
    height: '20px',
    width: '100%',
    textAlign: 'center',
    color: 'var(--el-text-color-regular)',
}

const ScrollList: FunctionalComponent<Props> = (props, { slots }) => {
    const { t } = useLocale()
    const style = useViewStyle(props.minWidth ?? 350)

    return (
        <Flex column gap={10}>
            <ElScrollbar viewStyle={style} onEnd-reached={props.loadMore}>
                {slots.default?.()}
            </ElScrollbar>
            <Flex v-show={props.loadMore} width='100%' justify='center' marginBottom={20}>
                {props.end
                    ? <p style={NO_MORE_STYLE}>{t('el.select.noData')}</p>
                    : <ElButton text icon={More} onClick={props.loadMore} loading={props.loading} />
                }
            </Flex>
        </Flex>
    )
}

export default ScrollList