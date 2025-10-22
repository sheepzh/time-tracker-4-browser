import { defineComponent } from "vue"
import Alert from "./components/Alert"
import Footer from "./components/Footer"
import Reason from "./components/Reason"
import { provideRule } from "./context"
import "./style/index.css"

const _default = defineComponent(() => {
    provideRule()

    return () => (
        <div id="app">
            <div style={{ width: '100%' }}>
                <Alert />
                <Reason />
                <Footer />
            </div>
        </div>
    )
})

export default _default