import { css } from '@emotion/css'
import Flex from "@pages/components/Flex"
import { useViewSlots } from "@popup/context"
import { useNamespace } from 'element-plus'
import { defineComponent, h, Transition } from "vue"
import Menu from "./Menu"

const buttonNs = useNamespace('button')
const footerCls = css`
    & .${buttonNs.b()}+${buttonNs.b()} {
        margin-inline-start: 6px;
    }
`

const Footer = defineComponent(() => {
    const { viewSlots } = useViewSlots()

    return () => (
        <Flex class={footerCls} justify="space-between" marginBottom={2} marginInline={1}>
            <Menu />
            <Transition name="el-fade-in" mode="out-in">
                {viewSlots.value?.toolbar && h(viewSlots.value.toolbar)}
            </Transition>
        </Flex>
    )
})

export default Footer