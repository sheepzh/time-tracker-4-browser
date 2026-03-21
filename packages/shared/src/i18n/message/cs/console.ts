import resource from './console-resource.json'

export type ConsoleMessage = {
    consoleLog: string
    closeAlert: string
}

const _default: Messages<ConsoleMessage> = resource

export default _default