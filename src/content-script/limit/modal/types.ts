import type { LimitReason } from '../types'

export type LimitReasonData = Omit<LimitReason, 'getVisitTime'>

export type MakeRegistry<Code extends string, Req = unknown, Res = unknown> = {
    [K in Code]: { req: Req; res: Res }
}

export type BridgeRegistry =
    & MakeRegistry<'reason', LimitReasonData | undefined, void>
    & MakeRegistry<'visitTime', void, number>
    & MakeRegistry<'delay', void, void>

export type BridgeCode = keyof BridgeRegistry
export type BridgeRequest<C extends BridgeCode> = BridgeRegistry[C]['req']
export type BridgeResponse<C extends BridgeCode> = BridgeRegistry[C]['res']
export type BridgeHandler<T extends BridgeCode> = (req: BridgeRequest<T>) => Promise<BridgeResponse<T>>