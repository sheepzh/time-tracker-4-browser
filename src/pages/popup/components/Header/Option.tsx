import { APP_LIMIT_ROUTE } from '@/shared/route'
import { css } from '@emotion/css'
import { useSwitch } from '@hooks'
import Flex from '@pages/components/Flex'
import { useMenu, useOption } from '@popup/context'
import { t, tN } from '@popup/locale'
import { getAppPageUrl } from '@util/constant/url'
import { ElCheckbox, ElIcon, ElInputNumber, ElLink, ElPopover, ElText, useNamespace } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"

const reference = () => (
    <ElIcon size="large" style={{ cursor: 'pointer' } satisfies StyleValue}>
        <svg viewBox="0 0 1024 1024">
            <path d="M800 32H224a192 192 0 0 0-192 192v576a192 192 0 0 0 192 192h576a192 192 0 0 0 192-192V224a192 192 0 0 0-192-192zM189.76 367.04A128 128 0 0 1 436.8 320h315.2a48 48 0 0 1 0 96h-315.84a128 128 0 0 1-246.08-48.96z m516.16 417.92A128 128 0 0 1 587.2 704H272a48 48 0 0 1 0-96h315.84a128 128 0 1 1 118.08 176.96z" />
        </svg>
    </ElIcon>
)

const Option = defineComponent(() => {
    const option = useOption()
    const { menu } = useMenu()
    const isPercentage = computed(() => menu.value === 'percentage')

    const toggleName = () => {
        option.showName = !option.showName
        close()
    }
    const toggleDonutChart = () => {
        option.donutChart = !option.donutChart
        close()
    }
    const handleSiteChange = (v: number | undefined) => {
        if (!v) return
        option.topN = v
        close()
    }

    const [visible, , close] = useSwitch()

    const inputNs = useNamespace('input')

    const topNInput = css`
        width: 70px;

        & .${inputNs.e('wrapper')} {
            padding-inline-start: 5px !important;
        }
    `

    return () => menu.value === 'limit' ? (
        <ElLink
            href={getAppPageUrl(APP_LIMIT_ROUTE)}
            target='_blank'
            style={{ '--el-link-text-color': 'unset', '--el-link-hover-text-color': 'unset' }}
        >
            {reference()}
        </ElLink>
    ) : (
        <ElPopover
            visible={visible.value}
            placement='auto-end'
            onUpdate:visible={v => visible.value = v}
            trigger='click'
            popperStyle={{ width: 'fit-content' }}
            v-slots={{ reference }}
        >
            <Flex column gap={5}>
                <Flex gap={4} align='center' cursor="pointer" onClick={toggleName}>
                    {/* Not to handle change event, bcz processed by the parent element already  */}
                    <ElCheckbox size='small' modelValue={option.showName} />
                    <ElText size='small'>{t(msg => msg.header.showSiteName)}</ElText>
                </Flex>
                <Flex v-show={isPercentage.value} gap={4} align='center' cursor="pointer" onClick={toggleDonutChart}>
                    <ElCheckbox size='small' modelValue={!!option.donutChart} />
                    <ElText size='small'>{t(msg => msg.header.donutChart)}</ElText>
                </Flex>
                <Flex v-show={isPercentage.value}>
                    <ElText size='small'>
                        {tN(msg => msg.header.showTopN, {
                            n: <ElInputNumber
                                class={topNInput}
                                size="small" controlsPosition='right'
                                step={5} min={5} max={100}
                                modelValue={option.topN}
                                onChange={handleSiteChange}
                            />
                        })}
                    </ElText>
                </Flex>
            </Flex>
        </ElPopover>
    )
})

export default Option