import resource from './focus-resource.json'

export type FocusMessage = {
    template: {
        title: string
    }
    state: Record<tt4b.focus.State, string>
    button: {
        resume: string
        pause: string
        delay: string
        restart: string
        preset: string
    }
}

const focusMessages = resource satisfies Messages<FocusMessage>
export default focusMessages