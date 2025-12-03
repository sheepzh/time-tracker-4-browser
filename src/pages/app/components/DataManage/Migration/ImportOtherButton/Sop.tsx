/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import DialogSop, { type SopStepInstance } from "@app/components/common/DialogSop"
import { t } from "@app/locale"
import { useManualRequest } from "@hooks"
import Flex from "@pages/components/Flex"
import { processImportedData } from "@service/components/import-processor"
import { ElMessage, ElStep, ElSteps } from "element-plus"
import { defineComponent, ref } from "vue"
import Step1 from "./Step1"
import Step2 from "./Step2"

type Props = {
    onCancel: NoArgCallback
    onImport: NoArgCallback
}

const _default = defineComponent<Props>((props) => {
    const step = ref<0 | 1>(0)
    const step1 = ref<SopStepInstance<timer.imported.Data>>()
    const step2 = ref<SopStepInstance<timer.imported.ConflictResolution>>()

    const { data, refresh: handleNext, loading: parsing } = useManualRequest(() => step1.value!.parseData(), {
        defaultValue: { rows: [] },
        onSuccess: () => step.value = 1,
        onError: e => ElMessage.error((e as Error)?.message ?? 'Unknown Error')
    })

    const { loading: importing, refresh: doImport } = useManualRequest(async () => {
        const resolution = await step2.value?.parseData?.()
        if (!resolution) throw new Error(t(msg => msg.dataManage.importOther.conflictNotSelected))
        await processImportedData(data.value, resolution)
    }, {
        onSuccess: () => {
            ElMessage.success(t(msg => msg.operation.successMsg))
            props.onImport?.()
        },
        onError: e => ElMessage.warning((e as Error)?.message ?? 'Unknown error'),
    })

    return () => (
        <DialogSop
            first={step.value === 0}
            last={step.value === 1}
            onCancel={props.onCancel}
            onBack={() => step.value = 0}
            onNext={handleNext}
            onFinish={doImport}
            nextLoading={parsing.value}
            finishLoading={importing.value}
            v-slots={{
                steps: () => (
                    <ElSteps space={200} finishStatus="success" active={step.value} alignCenter>
                        <ElStep title={t(msg => msg.dataManage.importOther.step1)} />
                        <ElStep title={t(msg => msg.dataManage.importOther.step2)} />
                    </ElSteps>
                ),
                content: () => (
                    <Flex width="100%" justify="center">
                        {step.value === 0 ? <Step1 ref={step1} /> : <Step2 ref={step2} data={data.value} />}
                    </Flex>
                ),
            }}
        />
    )
}, { props: ['onCancel', 'onImport'] })

export default _default