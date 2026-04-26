import resources from "./limit-resource.json"

export type LimitMessage = {
    noData: string
    newOne: string
    timeUsed: string
    visitUsed: string
    remain: string
    noLimit: string
    notHit: string
}

export default resources satisfies Messages<LimitMessage>