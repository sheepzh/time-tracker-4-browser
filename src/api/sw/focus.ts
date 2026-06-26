import { sendMsg2Runtime } from './common'

export const listFocusPresets = () => sendMsg2Runtime('focus.allPresets')

export const getFocusPreset = (id: number) => sendMsg2Runtime('focus.getPreset', id)

export const addFocusPreset = (preset: Omit<tt4b.focus.Preset, 'id'>) => sendMsg2Runtime('focus.addPreset', preset)

export const saveFocusPreset = (preset: tt4b.focus.Preset) => sendMsg2Runtime('focus.savePreset', preset)

export const deleteFocusPreset = (id: number) => sendMsg2Runtime('focus.deletePreset', id)

export const getCurrentSession = () => sendMsg2Runtime('focus.current')

export const focusAction = (request: tt4b.focus.ActionRequest) => sendMsg2Runtime('focus.action', request)
