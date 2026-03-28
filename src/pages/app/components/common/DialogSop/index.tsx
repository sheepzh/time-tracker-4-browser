import { t } from "@app/locale"
import { Back, Check, Close } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useXsState } from '@hooks/index'
import Box from "@pages/components/Box"
import Flex from "@pages/components/Flex"
import { type ButtonProps, DialogProps, ElButton, ElDialog, ElDivider, ElStep, ElSteps, ElText, useNamespace } from "element-plus"
import { defineComponent, h, type StyleValue, useSlots } from "vue"
import { useDialogSop } from './context'

type Props = {
    stepTitles: string[]
    finishButton?: {
        text?: string
        type?: ButtonProps['type']
    }
} & Pick<DialogProps, 'width' | 'top' | 'title'>

const DialogSop = defineComponent<Props>(props => {
    const {
        step, visible,
        isFirst, isLast, nextLoading,
        doNext, doPrevious, hide,
    } = useDialogSop()

    const isXs = useXsState()

    const stepWrapperCls = css`
        & .${useNamespace('step').b()} {
            width: 200px;
        }
    `

    return () => {
        const { default: children } = useSlots()

        return (
            <ElDialog
                width={props.width} top={props.top}
                fullscreen={isXs.value} appendToBody
                title={props.title}
                modelValue={visible.value} onClose={hide}
                closeOnClickModal
            >
                <Flex column align="center" gap={40} marginTop={25}>
                    <div class={stepWrapperCls}>
                        {isXs.value ? (
                            <Flex column align='center'>
                                <ElText size='large'>{props.stepTitles[step.value]}</ElText>
                                <ElDivider style={{ marginBlockStart: '5px' } satisfies StyleValue} />
                            </Flex>
                        ) : (
                            <ElSteps finishStatus="success" active={step.value} alignCenter>
                                {props.stepTitles.map(stepTitle => <ElStep title={stepTitle} />)}
                            </ElSteps>
                        )}
                    </div>
                    <Box padding="0 20px" boxSizing="border-box" width="100%">
                        {!!children && h(children)}
                    </Box>
                    <Flex>
                        <ElButton type='info' icon={isFirst.value ? Close : Back} onClick={doPrevious}>
                            {t(msg => msg.button[isFirst.value ? 'cancel' : 'previous'])}
                        </ElButton>
                        <ElButton
                            icon={Check}
                            type={isLast.value ? props.finishButton?.type ?? 'success' : 'primary'}
                            onClick={doNext}
                            loading={nextLoading.value}
                        >
                            {isLast.value ? props.finishButton?.text ?? t(msg => msg.button.save) : t(msg => msg.button.next)}
                        </ElButton>
                    </Flex>
                </Flex>
            </ElDialog>
        )
    }
}, { props: ['title', 'stepTitles', 'finishButton', 'width', 'top'] })

export default DialogSop
