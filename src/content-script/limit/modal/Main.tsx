import "@pages/element-ui/dark-theme.css"
import "element-plus/theme-chalk/el-button-group.css"
import "element-plus/theme-chalk/el-button.css"
import "element-plus/theme-chalk/el-descriptions-item.css"
import "element-plus/theme-chalk/el-descriptions.css"
import "element-plus/theme-chalk/el-input.css"
import "element-plus/theme-chalk/el-message-box.css"
import "element-plus/theme-chalk/el-message.css"
import "element-plus/theme-chalk/el-tag.css"
import { defineComponent } from "vue"
import Alert from "./components/Alert"
import Footer from "./components/Footer"
import Reason from "./components/Reason"
import { provideRule } from "./context"
import "./style/element-base.css"
import "./style/modal.css"

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