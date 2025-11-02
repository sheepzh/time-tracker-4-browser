import { css } from '@emotion/css'
import { useXsState } from '@hooks/useMediaSize'
import Flex from "@pages/components/Flex"
import { colorUsage, colorVariant } from '@pages/util/style'
import { computed, defineComponent, h, StyleValue, useSlots } from "vue"

type Props = { name: string, href: string }

const useStyle = () => {
    const containerCls = css`
        border-radius: 4px;
        background-color: var(${colorUsage('fill')});
        height: 7.5rem;
        width: 7.5rem;

        &:hover {
            border: 1px solid var(${colorVariant('primary')});
        }

        html[data-media-size='xs'] & {
            height: unset;
            width: unset;
            background-color: unset;
        }
    `

    const nameCls = css`
        text-align: center;
        line-height: 24px;
        font-size: 14px;
        color: var(--el-text-color-primary);
        font-weight: 500;

        html[data-media-size='xs'] & {
            display: none;
        }
    `

    return [containerCls, nameCls]
}

const InstallationLink = defineComponent<Props>(({ href, name }) => {
    const [containerCls, nameCls] = useStyle()
    const { default: icon } = useSlots()
    const isXs = useXsState()
    const iconStyle = computed<StyleValue>(() => {
        const size = isXs.value ? '2em' : '2.5em'
        return { width: size, height: size }
    })

    return () => (
        <Flex justify="center" boxSizing="border-box" class={containerCls}>
            <Flex
                as="a" href={href} target='_blank'
                width='100%' column justify='center' align='center' gap={8}
                style={{ textDecorationLine: 'none' }}
            >
                <div style={iconStyle.value}>
                    {icon && h(icon)}
                </div>
                <span class={nameCls}>{name}</span>
            </Flex>
        </Flex>
    )
}, { props: ['href', 'name'] })

export default InstallationLink