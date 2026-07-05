import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import Header from "./components/Header"
import Menu from './components/Menu'
import { initPopupContext } from "./context"
import { TOOLBAR_SLOT } from './slot'

const Main = defineComponent(() => {
    const appKey = initPopupContext()

    return () => (
        <Flex key={appKey.value} column width='100%' height='100%' gap={10}>
            <Header />
            <Flex flex={1} height={0}>
                <RouterView />
            </Flex>
            <Flex justify="space-between" marginBottom={2} marginInline={1}>
                <Menu />
                <div id={TOOLBAR_SLOT} />
            </Flex>
        </Flex>
    )
})

export default Main
