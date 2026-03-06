import DialogSop, { type SopInstance, type SopStepInstance } from "@app/components/common/DialogSop"
import { t } from "@app/locale"
import { useManualRequest, useState } from "@hooks"
import processor from "@service/backup/processor"
import { ElMessage, ElStep, ElSteps } from "element-plus"
import { defineComponent, ref } from "vue"
import Step1, { type StatResult } from "./Step1"
import Step2 from "./Step2"

type Props = {
    onCancel: NoArgCallback
    onClear: NoArgCallback
}

const _default = defineComponent<Props>((props, ctx) => {
    const [step, setStep] = useState<0 | 1>(0)
    const step1 = ref<SopStepInstance<StatResult>>()

    const { data, refresh: handleNext, loading: readingClient } = useManualRequest(() => step1.value?.parseData?.(), {
        onSuccess: () => setStep(1),
        onError: e => ElMessage.warning((e as Error)?.message || 'Unknown error'),
    })

    const { refresh: handleClear, loading: deleting } = useManualRequest(async () => {
        const cid = data.value?.client?.id
        if (!cid) throw new Error('Client not selected')
        const result = await processor.clear(cid)
        if (!result.success) throw new Error(result.errorMsg)
    }, {
        onSuccess: () => {
            ElMessage.success(t(msg => msg.operation.successMsg))
            props.onClear?.()
        },
        onError: e => ElMessage.warning((e as Error)?.message || 'Unknown error'),
    })

    ctx.expose({ init: () => setStep(0) } satisfies SopInstance)

    return () => (
        <DialogSop
            first={step.value === 0}
            last={step.value === 1}
            onCancel={props.onCancel}
            onNext={handleNext}
            nextLoading={readingClient.value}
            onBack={() => step.value = 0}
            onFinish={handleClear}
            finishBtn={{ text: t(msg => msg.option.backup.clear.btn), type: 'danger' }}
            finishLoading={deleting.value}
            v-slots={{
                steps: () => (
                    <ElSteps space={200} finishStatus="success" active={step.value} alignCenter>
                        <ElStep title={t(msg => msg.option.backup.clientTable.selectTip)} />
                        <ElStep title={t(msg => msg.option.backup.confirmStep)} />
                    </ElSteps>
                ),
                content: () => step.value === 0 ? <Step1 ref={step1} /> : <Step2 data={data.value} />
            }}
        />
    )
}, { props: ['onCancel', 'onClear'] })

export default _default