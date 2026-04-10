import type { BridgeCode, BridgeHandler, BridgeRequest, BridgeResponse } from './types'

type RpcBase<C extends BridgeCode> = {
    code: C
    requestId: string
}

type RpcRequest<C extends BridgeCode> = RpcBase<C> & {
    kind: 'request'
    data: BridgeRequest<C>
}

type RpcResponse<C extends BridgeCode> = RpcBase<C> & {
    kind: 'response'
    data: BridgeResponse<C>
}

const isRpcRequest = (payload: unknown): payload is RpcRequest<BridgeCode> => {
    if (typeof payload !== 'object' || payload === null) return false
    // Just judge the kind
    return 'kind' in payload && payload.kind === 'request'
}

const isRpcResponse = (payload: unknown): payload is RpcResponse<BridgeCode> => {
    if (typeof payload !== 'object' || payload === null) return false
    // Just judge the kind
    return 'kind' in payload && payload.kind === 'response'
}

type ModalBridgeConfig = {
    targetOrigin: string
    peer: () => Window | null | undefined
    acceptFromPeer: (ev: MessageEvent) => boolean
}

export class ModalBridge {
    private readonly cfg: ModalBridgeConfig
    private readonly pendingCache = new Map<string, ArgCallback<RpcResponse<BridgeCode>>>()
    private readonly handlers = new Map<BridgeCode, BridgeHandler<BridgeCode>>()
    private readonly onMessageBound: (ev: MessageEvent) => void

    constructor(cfg: ModalBridgeConfig) {
        this.cfg = cfg
        this.onMessageBound = this.onMessage.bind(this)
        window.addEventListener('message', this.onMessageBound)
    }

    dispose(): void {
        window.removeEventListener('message', this.onMessageBound)
        this.pendingCache.clear()
        this.handlers.clear()
    }

    register<C extends BridgeCode>(code: C, handler: BridgeHandler<C>) {
        this.handlers.set(code, handler as unknown as BridgeHandler<BridgeCode>)
    }

    request<C extends BridgeCode>(code: C, req: BridgeRequest<C>): Promise<BridgeResponse<C>> {
        const requestId = `${code}-${Date.now()}-${Math.random().toString(12).slice(2)}`
        return new Promise<BridgeResponse<C>>((resolve, reject) => {
            const t = window.setTimeout(() => {
                this.pendingCache.delete(requestId)
                reject("Timeout")
            }, 1_000)
            this.pendingCache.set(requestId, msg => {
                if (msg.kind !== 'response' || msg.code !== code) return
                clearTimeout(t)
                this.pendingCache.delete(requestId)
                resolve(msg.data)
            })
            this.send({ kind: 'request', code, requestId, data: req })
        })
    }

    private send<C extends BridgeCode>(payload: RpcRequest<C> | RpcResponse<C>): void {
        this.cfg.peer()?.postMessage(payload, this.cfg.targetOrigin)
    }

    private async onMessage(ev: MessageEvent) {
        if (!this.cfg.acceptFromPeer(ev)) return
        const { data: payload } = ev
        if (isRpcRequest(payload)) {
            const { code, data: reqData, requestId } = payload
            const handler = this.handlers.get(code)
            if (!handler) {
                // todo return error
                return
            }
            const data = await handler(reqData)
            this.send({ kind: 'response', requestId, code, data })
        } else if (isRpcResponse(payload)) {
            const pending = this.pendingCache.get(payload.requestId)
            pending?.(payload)
        }
    }
}
