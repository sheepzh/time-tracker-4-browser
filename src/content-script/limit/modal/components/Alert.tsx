import { getUrl } from "@api/chrome/runtime"
import { t } from "@cs/locale"
import { css } from '@emotion/css'
import { useRequest } from "@hooks/useRequest"
import optionHolder from "@service/components/option-holder"
import { defineComponent } from "vue"

const ICON_URL = getUrl('static/images/icon.png')
const ALERT_CLS = css`
    margin-bottom: 80px;
    h1 {
        font-size: 2.7em;
        max-width: 50vw;
        margin: auto;
        margin-block-start: 0.67em;
        margin-block-end: 0.67em;
    }
`
const NAME_CLS = css`
    margin-block-end: 0.67em;
    img {
        width: 1.4em;
        height: 1.4em;
        margin-inline-end: .4em;
    }
    img,span {
        vertical-align: middle;
        line-height: 2em;
    }
`

const _default = defineComponent(() => {
    const defaultPrompt = t(msg => msg.modal.defaultPrompt)
    const { data: prompt } = useRequest(async () => {
        const option = await optionHolder.get()
        return option?.limitPrompt || defaultPrompt
    }, { defaultValue: defaultPrompt })
    return () => (
        <div class={ALERT_CLS}>
            <h2 class={NAME_CLS}>
                <img src={ICON_URL} />
                <span> {t(msg => msg.meta.name)?.toUpperCase()}</span>
            </h2>
            <h1>{prompt.value}</h1>
        </div>
    )
})

export default _default