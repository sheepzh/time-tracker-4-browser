import resource from './modal-resource.json'

export type ModalMessage = {
    defaultPrompt: string
    delay: string
    browsingTime: string
    ruleDetail: string
    pomodoroActive: string
    focusActive: string
    focusBlocked: string
}

const _default: Messages<ModalMessage> = resource

export default _default