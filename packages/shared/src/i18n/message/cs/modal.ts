import resource from './modal-resource.json'

export type ModalMessage = {
    defaultPrompt: string
    more5Minutes: string
    browsingTime: string
    ruleDetail: string
}

const _default: Messages<ModalMessage> = resource

export default _default