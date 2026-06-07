import { sendMsg2Runtime } from './common'

export const listFocusPresets = () => sendMsg2Runtime('focus.allPresets')

export const getCurrentSession = () => sendMsg2Runtime('focus.current')

export const focusAction = (request: tt4b.focus.ActionRequest) => sendMsg2Runtime('focus.action', request)
