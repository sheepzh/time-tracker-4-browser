import { defineComponent, useSlots } from "vue"
import { initFocusContext } from "./components/Focus/context"
import { initLimitContext } from "./components/Limit/context"
import { initStatContext } from "./components/stat/context"

const Provider = defineComponent<{}>(() => {
    initStatContext()
    initLimitContext()
    initFocusContext()

    return () => useSlots().default?.()
})

export default Provider