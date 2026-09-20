import { createObjectGuard, isAny, isInt } from 'typescript-guard'

export type FrameRequest = {
    stamp: number
    data: any
}

export type FrameResponse = {
    stamp: number
}

export const isRequest = createObjectGuard<FrameRequest>({ stamp: isInt, data: isAny })
export const isResponse = createObjectGuard<FrameResponse>({ stamp: isInt })