import resource from './rule-resource.json'

export type RuleMessage = {
    white: {
        label: string
        addConfirmMsg: string
        removeConfirmMsg: string
        infoAlertTitle: string
        infoAlert0: string
        infoAlert1: string
        infoAlert2: string
    }
    merge: {
        label: string
        removeConfirmMsg: string
        originPlaceholder: string
        mergedPlaceholder: string
        errorOrigin: string
        duplicateMsg: string
        addConfirmMsg: string
        infoAlertTitle: string
        infoAlert0: string
        infoAlert1: string
        infoAlert2: string
        infoAlert3: string
        infoAlert4: string
        infoAlert5: string
        tagResult: {
            blank: string
            level: string
        }
    }
}

const _default: Messages<RuleMessage> = resource satisfies Messages<RuleMessage>

export default _default