import resource from './focus-resource.json'

export type FocusMessage = {
    deleteConfirm: string
    presetName: string
    template: string
}

export default resource satisfies Messages<FocusMessage>