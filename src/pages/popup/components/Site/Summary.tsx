import Flex from '@pages/components/Flex'
import Img from '@pages/components/Img'
import { ElIcon, ElText } from 'element-plus'
import { computed, type CSSProperties, defineComponent, h, } from 'vue'
import { SITE_SUMMARY_DROPDOWN_SLOT, SITE_TYPE_ICON } from './common'
import { useSite } from './context'

const TITLE_SIZE = 24

const Summary = defineComponent<{}>(() => {
    const { site, url } = useSite()
    const siteLabel = computed(() => {
        const s = site.value
        if (!s) return ''
        const { alias, host } = s
        return alias ? `${alias} (${host})` : host
    })

    const pureUrl = computed(() => {
        const original = url.value
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
            <Flex align='center' justify='center' gap={12} height={35} fontSize={TITLE_SIZE}>
                <Img src={site.value?.iconUrl} size={TITLE_SIZE}>
                    <ElIcon>
                        {site.value?.type ? h(SITE_TYPE_ICON[site.value.type]) : null}
                    </ElIcon>
                </Img>
                <ElText style={{ fontSize: `${TITLE_SIZE}px` } satisfies CSSProperties} >
                    {siteLabel.value}
                </ElText>
                <Flex id={SITE_SUMMARY_DROPDOWN_SLOT} />
            </Flex>
            <ElText
                size='large'
                style={{
                    wordBreak: 'break-all',
                    textAlign: 'center',
                    lineHeight: '1.4em',
                } satisfies CSSProperties}
            >
                {pureUrl.value}
            </ElText>
        </Flex>
    )
})

export default Summary