import { onTabMessage } from "@api/chrome/runtime"
import { allMatch, anyMatch } from "@util/array"
import ModalInstance from "./modal/instance"
import MessageAdaptor from "./processor/message-adaptor"
import PeriodProcessor from "./processor/period-processor"
import VisitProcessor from "./processor/visit-processor"
import Reminder from "./reminder"
import type { MaskModal, ModalContext, Processor } from './types'

export default async function processLimit(url: string) {
    const modal: MaskModal = new ModalInstance(url)
    const context: ModalContext = { modal, url }

    const processors: Processor[] = [
        new MessageAdaptor(context),
        new PeriodProcessor(context),
        new VisitProcessor(context),
        new Reminder(),
    ]

    await Promise.all(processors.map(p => p.init()))

    onTabMessage(async msg => {
        const { code, data } = msg
        const results = await Promise.all(processors.map(async p => p.handleMsg(code, data)))

        const allIgnore = allMatch(results, (r: timer.tab.Response) => r.code === "ignore")
        if (allIgnore) return { code: "ignore" as const }

        const anyFail = anyMatch(results, (r: timer.tab.Response) => r.code === "fail")
        if (anyFail) {
            const failResult = results.find((r): r is timer.tab.Response & { code: "fail" } => r.code === "fail")
            return { code: "fail" as const, msg: failResult?.msg ?? "" }
        }
        // Merge data of all the handlers
        const items = results
            .filter((r): r is timer.tab.Response & { code: "success" } => r.code === "success")
            .map(r => r.data)
            .filter((r): r is NonNullable<typeof r> => r !== undefined && r !== null)
        const mergedData = items.length <= 1 ? items[0] : items
        return { code: "success", data: mergedData } as timer.tab.Response<typeof code>
    })
}
