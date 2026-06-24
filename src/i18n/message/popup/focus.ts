import resource from './focus-resource.json'

export type FocusMessage = {
    chooseMethod: string
    button: {
        resume: string
        pause: string
        delay: string
        dismiss: string
        preset: string
    }
}

const focusMessages = resource satisfies Messages<FocusMessage>
export default focusMessages