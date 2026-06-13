import Flex from '@pages/components/Flex'
import Img from '@pages/components/Img'
import { ElText } from 'element-plus'
import { computed, defineComponent, StyleValue } from 'vue'
import { useLimitContext } from './context'

const TITLE_SIZE = 24

const Summary = defineComponent<{}>(() => {
    const { summary } = useLimitContext()
    const site = computed(() => {
        const site = summary.value?.site
        if (!site) return ''
        const { alias, host } = site
        return alias ? `${alias} (${host})` : host
    })

    const withoutSearch = computed(() => {
        const original = summary.value?.url
        if (!original) return undefined
        try {
            const u = new URL(original)
            return u.origin + u.pathname
        } catch {
            return original
        }
    })

    return () => (
        <Flex column justify='center' align='center' gap={10} marginTop={20} marginBottom={20}>
            <Flex align='center' justify='center' gap={12}>
                <Img src={summary.value?.site.iconUrl} size={TITLE_SIZE} />
                <ElText style={{ fontSize: `${TITLE_SIZE}px` } satisfies StyleValue} >
                    {site.value}
                </ElText>
            </Flex>
            <ElText
                size='large'
                style={{
                    wordBreak: 'break-all',
                    textAlign: 'center',
                    lineHeight: '1.4em',
                } satisfies StyleValue}
            >
                {withoutSearch.value}
            </ElText>
        </Flex>
    )
})

export default Summary