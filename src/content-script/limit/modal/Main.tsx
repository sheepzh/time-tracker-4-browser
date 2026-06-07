import "@pages/element-ui/dark-theme.css"
import { defineComponent } from "vue"
import FocusView from './components/FocusView'
import LimitView from './components/LimitView'
import { provideRule } from './context'
import "./style/element-base.css"
import "./style/modal.css"

const _default = defineComponent(() => {
    const reason = provideRule()

    return () => {
        const val = reason.value
        if (!val) return null
        return (
            <div id="app">
                <div style={{ width: '100%' }}>
                    {val.type === 'FOCUS'
                        ? <FocusView value={val} />
                        : <LimitView value={val} />
                    }
                </div>
            </div>
        )
    }
})

export default _default