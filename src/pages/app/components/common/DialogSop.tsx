import { t } from "@app/locale"
import { Back, Check, Close, Right } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import Box from "@pages/components/Box"
import Flex from "@pages/components/Flex"
import { ElButton, useNamespace } from "element-plus"
import { defineComponent, h, useSlots } from "vue"

export type SopStepInstance<T> = { parseData: Getter<T> }

export type SopInstance = { init: NoArgCallback }

const FLAGS = ['first', 'last', 'nextLoading', 'finishLoading'] as const
const EMITS = ['onBack', 'onNext', 'onCancel', 'onFinish'] as const

type Props = {
    [F in typeof FLAGS[number]]?: boolean
} & {
    [C in typeof EMITS[number]]?: NoArgCallback
}

const DialogSop = defineComponent<Props>(props => {
    const { steps, content } = useSlots()

    const stepNs = useNamespace('step')
    const containerClz = css`
        .${stepNs.b()} {
            width: 200px;
        }
    `

    return () => (
        <Flex column align="center" gap={40} marginTop={25}>
            <div class={containerClz}>
                {!!steps && h(steps)}
            </div>
            <Box padding="0 20px" boxSizing="border-box" width="100%">
                {!!content && h(content)}
            </Box>
            <Flex>
                <Flex>
                    {props.first ? (
                        <ElButton type="info" icon={Close} onClick={props.onCancel}>
                            {t(msg => msg.button.cancel)}
                        </ElButton>
                    ) : (
                        <ElButton type="info" icon={Back} onClick={props.onBack}>
                            {t(msg => msg.button.previous)}
                        </ElButton>
                    )}{
                        props.last ? (
                            <ElButton type='success' icon={Check} onClick={props.onFinish} loading={props.finishLoading}>
                                {t(msg => msg.button.save)}
                            </ElButton>
                        ) : (
                            <ElButton type="primary" icon={Right} onClick={props.onNext} loading={props.nextLoading}>
                                {t(msg => msg.button.next)}
                            </ElButton>
                        )
                    }
                </Flex>
            </Flex>
        </Flex>
    )
}, { props: [...FLAGS, ...EMITS] })

export default DialogSop