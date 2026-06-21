import { getOption } from '@api/sw/option'
import type { LimitReason } from '@cs/limit/types'
import { t } from '@cs/locale'
import { useRequest } from '@hooks'
import { defineComponent, toRef } from 'vue'
import Alert from '../Alert'
import Footer from './Footer'
import Reason from './Reason'
import { injectLimitReason } from './context'

const usePrompt = () => {
    const defaultPrompt = t(msg => msg.modal.defaultPrompt)
    const { data: prompt } = useRequest(async () => {
        const option = await getOption()
        return option?.limitPrompt ?? defaultPrompt
    }, { defaultValue: defaultPrompt })
    return prompt
}

const LimitView = defineComponent<{ value: LimitReason }>(props => {
    const value = toRef(props, 'value')
    injectLimitReason(value)
    const prompt = usePrompt()

    return () => <>
        <Alert prompt={prompt.value} />
        <Reason />
        <Footer />
    </>
}, { props: ['value'] })

export default LimitView