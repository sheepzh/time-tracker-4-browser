import { getUrl } from "@api/chrome/runtime"
import { t } from "@cs/locale"
import { useRequest } from "@hooks/useRequest"
import optionHolder from "@service/components/option-holder"
import { defineComponent } from "vue"

const ICON_URL = getUrl('static/images/icon.png')

const _default = defineComponent(() => {
    const defaultPrompt = t(msg => msg.modal.defaultPrompt)
    const { data: prompt } = useRequest(async () => {
        const option = await optionHolder.get()
        return option?.limitPrompt || defaultPrompt
    }, { defaultValue: defaultPrompt })
    return () => (
        <div class='alert-container'>
            <h2 class='name-line'>
                <img src={ICON_URL} />
                <span> {t(msg => msg.meta.name)?.toUpperCase()}</span>
            </h2>
            <h1>{prompt.value}</h1>
        </div>
    )
})

export default _default