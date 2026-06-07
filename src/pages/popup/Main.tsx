import Flex from "@pages/components/Flex"
import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import Footer from "./components/Footer"
import Header from "./components/Header"
import { initPopupContext } from "./context"
import Provider from "./Provider"

const Main = defineComponent(() => {
    const appKey = initPopupContext()

    return () => (
        <Flex key={appKey.value} column width='100%' height='100%' gap={10}>
            <Provider>
                <Header />
                <Flex flex={1} height={0}>
                    <RouterView />
                </Flex>
                <Footer />
            </Provider>
        </Flex>
    )
})

export default Main


