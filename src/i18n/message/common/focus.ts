import resource from './focus-resource.json'

export type FocusMessage = {
    menu: string
    policy: Record<tt4b.focus.FilterPolicy, {
        label: string
        desc: string
    }> & { label: string }
    duration: string
    break: string
    method: Record<tt4b.focus.Method, {
        label: string
        desc: string
    }> & {
        choose: string
        label: string
    }
    state: Record<tt4b.focus.State, string>
    noAllowUrl: string
    noBlockUrl: string
    noTime: string
    preset: string
    presetName: string
    button: {
        resume: string
        pause: string
        delay: string
        dismiss: string
        abort: string
    }
}

const _default: Messages<FocusMessage> = resource

export default _default