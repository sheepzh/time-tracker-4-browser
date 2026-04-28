import Flex from "@pages/components/Flex"
import { useMenu } from "@popup/context"
import { defineComponent, Transition } from "vue"
import DataToolbar from './DataToolbar'
import LimitToolbar from './LimitToolbar'
import Menu from "./Menu"

const Footer = defineComponent(() => {
    const { menu } = useMenu()

    return () => (
        <Flex justify="space-between" marginBottom={2} marginInline={1}>
            <Menu />
            <Transition name="el-fade-in" mode="out-in">
                {menu.value === 'limit' ? <LimitToolbar /> : <DataToolbar />}
            </Transition>
        </Flex>
    )
})

export default Footer