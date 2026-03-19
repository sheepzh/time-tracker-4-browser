import { onRuntimeMessage } from "@api/chrome/runtime"
import { allMatch } from "@util/array"
import { type MaskModal, type ModalContext, type Processor } from "./common"
import ModalInstance from "./modal"
import MessageAdaptor from "./processor/message-adaptor"
import PeriodProcessor from "./processor/period-processor"
import VisitProcessor from "./processor/visit-processor"
import Reminder from "./reminder"

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

    onRuntimeMessage(async (msg: timer.mq.Request<timer.mq.ReqCode>) => {
        const { code, data } = msg
        const results = await Promise.all(processors.map(async p => p.handleMsg(code, data)))

        const allIgnore = allMatch(results, (r: timer.mq.Response) => r.code === "ignore")
        if (allIgnore) return { code: "ignore" as const }

        const anyFail = allMatch(results, (r: timer.mq.Response) => r.code === "fail")
        if (anyFail) {
            const failResult = results.find((r): r is timer.mq.Response & { code: "fail" } => r.code === "fail")
            return { code: "fail" as const, msg: failResult?.msg ?? "" }
        }
        // Merge data of all the handlers
        const items = results
            .filter((r): r is timer.mq.Response & { code: "success" } => r.code === "success")
            .map(r => r.data)
            .filter((r): r is NonNullable<typeof r> => r !== undefined && r !== null)
        const mergedData = items.length <= 1 ? items[0] : items
        return { code: "success", data: mergedData } as timer.mq.Response<typeof code>
    })
}
