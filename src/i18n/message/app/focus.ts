import resource from './focus-resource.json'

export type FocusMessage = {
    deleteConfirm: string
    method: string
}

export default resource satisfies Messages<FocusMessage>