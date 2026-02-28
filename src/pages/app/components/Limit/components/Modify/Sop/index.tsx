/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import DialogSop from "@app/components/common/DialogSop"
import { t } from "@app/locale"
import { useXsState } from '@hooks'
import Flex from '@pages/components/Flex'
import { ElDivider, ElStep, ElSteps, ElText } from "element-plus"
import { computed, defineComponent, StyleValue } from "vue"
import { initSop, type Step } from "./context"
import Step1 from "./Step1"
import Step2 from "./Step2"
import Step3 from "./Step3"

export type SopInstance = {
    /**
     * Reset with rule or initial value
     */
    reset: (rule?: timer.limit.Rule) => void
}

type Props = {
    onCancel?: NoArgCallback
    onSave?: ArgCallback<MakeOptional<timer.limit.Rule, 'id'>>
}

const STEP_TITLE: Record<Step, string> = {
    0: t(msg => msg.limit.step.base),
    1: t(msg => msg.limit.step.url),
    2: t(msg => msg.limit.step.rule),
}

const _default = defineComponent<Props>(({ onSave, onCancel }, ctx) => {
    const { reset, step, handleNext } = initSop({ onSave })
    const last = computed(() => step.value === 2)
    const first = computed(() => step.value === 0)
    ctx.expose({ reset } satisfies SopInstance)

    const isXs = useXsState()

    return () => (
        <DialogSop
            last={last.value}
            first={first.value}
            onBack={() => step.value--}
            onCancel={onCancel}
            onNext={handleNext}
            onFinish={handleNext}
            v-slots={{
                steps: () => isXs.value
                    ? (
                        <Flex column align='center'>
                            <ElText size='large'>{STEP_TITLE[step.value]}</ElText>
                            <ElDivider style={{ marginBlockStart: '5px' } satisfies StyleValue} />
                        </Flex>
                    )
                    : (
                        <ElSteps space={200} finishStatus="success" active={step.value} alignCenter>
                            <ElStep title={STEP_TITLE[0]} />
                            <ElStep title={STEP_TITLE[1]} />
                            <ElStep title={STEP_TITLE[2]} />
                        </ElSteps>
                    ),
                content: () => <>
                    <Step1 v-show={step.value === 0} />
                    <Step2 v-show={step.value === 1} />
                    <Step3 v-show={step.value === 2} />
                </>
            }}
        />
    )
}, { props: ['onCancel', 'onSave'] })

export default _default