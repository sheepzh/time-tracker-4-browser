/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { importOther } from '@api/sw/immigration'
import DialogSop from '@app/components/common/DialogSop'
import { initDialogSopContext } from '@app/components/common/DialogSop/context'
import { useDataMemory } from '@app/components/DataManage/context'
import { t } from "@app/locale"
import { css } from '@emotion/css'
import { useRequest, useState } from '@hooks'
import Flex from '@pages/components/Flex'
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon, ElText } from "element-plus"
import { computed, defineComponent, type FunctionalComponent, h, toRaw } from "vue"
import { detectWatt } from './detector'
import { parseFile } from './processor'
import Step1 from './Step1'
import Step2 from './Step2'
import type { ImportForm, OtherExtension } from './types'

type Config = {
    name: string
    Icon: FunctionalComponent<{}>
}

const EXTENSION_CONFIGS: Record<OtherExtension, Config> = {
    webtime_tracker: {
        name: "Webtime Tracker",
        Icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
                <g><path style="opacity:1" fill="#3896fa" d="M 52.5,-0.5 C 54.1667,-0.5 55.8333,-0.5 57.5,-0.5C 58.8309,8.13683 58.8309,16.8035 57.5,25.5C 53.6019,26.975 49.6019,28.1417 45.5,29C 41.6563,31.5153 37.823,34.0153 34,36.5C 27.7055,32.376 21.5388,28.0426 15.5,23.5C 14.3691,21.9255 14.2025,20.2588 15,18.5C 25.3653,7.73449 37.8653,1.40116 52.5,-0.5 Z" /></g>
                <g><path style="opacity:1" fill="#f9645c" d="M 61.5,-0.5 C 63.1667,-0.5 64.8333,-0.5 66.5,-0.5C 96.5,4.83333 114.167,22.5 119.5,52.5C 119.5,57.1667 119.5,61.8333 119.5,66.5C 114.167,96.5 96.5,114.167 66.5,119.5C 62.5,119.5 58.5,119.5 54.5,119.5C 41.2903,118.898 29.957,113.898 20.5,104.5C 26.0177,98.8165 31.351,92.9832 36.5,87C 43.7447,89.8929 51.4114,91.7263 59.5,92.5C 73.6465,92.5144 83.8132,86.181 90,73.5C 97.1507,47.4534 87.6507,31.4534 61.5,25.5C 60.1691,16.8035 60.1691,8.13683 61.5,-0.5 Z" /></g>
                <g><path style="opacity:1" fill="#51c15c" d="M -0.5,66.5 C -0.5,61.8333 -0.5,57.1667 -0.5,52.5C 0.666576,42.9739 3.99991,34.1406 9.5,26C 10.9078,25.6848 12.2411,26.0181 13.5,27C 18.5,30.6667 23.5,34.3333 28.5,38C 29.8045,38.804 30.4712,39.9707 30.5,41.5C 24.1818,56.0341 25.5151,69.7007 34.5,82.5C 29.4427,88.737 24.1093,94.9037 18.5,101C 17.5,101.667 16.5,101.667 15.5,101C 6.46176,91.0972 1.12842,79.5972 -0.5,66.5 Z" /></g>
            </svg>
        ),
    },
    web_activity_time_tracker: {
        name: "Web Activity Time Tracker",
        Icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
                <g><path style="opacity:1" fill="#023750" d="M 45.5,-0.5 C 54.8333,-0.5 64.1667,-0.5 73.5,-0.5C 74.7785,2.00241 74.7785,4.50241 73.5,7C 70.1832,7.49834 66.8499,7.66501 63.5,7.5C 63.5,9.83333 63.5,12.1667 63.5,14.5C 74.5659,14.5351 84.2325,18.2017 92.5,25.5C 94.3586,23.8076 96.3586,22.3076 98.5,21C 105.333,19.8333 108.167,22.6667 107,29.5C 105.692,31.6414 104.192,33.6414 102.5,35.5C 120.15,66.7322 114.483,92.8989 85.5,114C 80.285,116.571 74.9516,118.404 69.5,119.5C 62.8333,119.5 56.1667,119.5 49.5,119.5C 26.929,113.761 12.7623,99.4278 7,76.5C 4.65865,61.5335 7.82532,47.8669 16.5,35.5C 14.4346,32.9573 13.1012,30.1239 12.5,27C 13.0621,21.4471 16.0621,19.4471 21.5,21C 23.5852,22.0414 25.2519,23.5414 26.5,25.5C 34.7685,18.2011 44.4352,14.5344 55.5,14.5C 55.5,12.1667 55.5,9.83333 55.5,7.5C 52.1501,7.66501 48.8168,7.49834 45.5,7C 44.2215,4.50241 44.2215,2.00241 45.5,-0.5 Z" /></g>
                <g><path style="opacity:1" fill="#eff2f0" d="M 52.5,21.5 C 71.0342,20.1879 85.8675,26.8546 97,41.5C 108.799,63.1963 106.299,83.0297 89.5,101C 64.3901,118.657 41.8901,115.824 22,92.5C 11.2242,73.4867 12.2242,55.1534 25,37.5C 32.8691,29.7679 42.0357,24.4345 52.5,21.5 Z" /></g>
                <g><path style="opacity:1" fill="#6aba57" d="M 53.5,29.5 C 54.8333,29.5 56.1667,29.5 57.5,29.5C 57.3354,32.5184 57.502,35.5184 58,38.5C 59,39.8333 60,39.8333 61,38.5C 61.3333,35.5 61.6667,32.5 62,29.5C 82.4616,32.4608 93.9616,44.1274 96.5,64.5C 93.5525,64.2229 90.7191,64.5562 88,65.5C 87.3162,66.7839 87.4829,67.9505 88.5,69C 91.1667,69.3333 93.8333,69.6667 96.5,70C 93.7002,90.1331 82.2002,101.633 62,104.5C 61.502,101.518 61.3354,98.5184 61.5,95.5C 60.1667,95.5 58.8333,95.5 57.5,95.5C 57.6646,98.5184 57.498,101.518 57,104.5C 36.7998,101.633 25.2998,90.1331 22.5,70C 25.1667,69.6667 27.8333,69.3333 30.5,69C 31.5171,67.9505 31.6838,66.7839 31,65.5C 28.2809,64.5562 25.4475,64.2229 22.5,64.5C 24.6824,45.6491 35.0158,33.9824 53.5,29.5 Z" /></g>
                <g><path style="opacity:1" fill="#033751" d="M 79.5,41.5 C 84.1225,40.4082 85.9558,42.0748 85,46.5C 76.4048,54.4232 68.5715,62.9232 61.5,72C 55.7247,72.2045 53.5581,69.3712 55,63.5C 64.2013,57.4732 72.3679,50.1399 79.5,41.5 Z" /></g>
            </svg>
        ),
    },
    history_trends_unlimited: {
        name: "History Trends Unlimited",
        Icon: () => (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
                <g><path style="opacity:1" fill="#e6e000" d="M 59.5,5.5 C 59.5,23.8333 59.5,42.1667 59.5,60.5C 42.4539,65.6783 25.4539,71.0117 8.5,76.5C 1.16551,47.0244 10.8322,24.8577 37.5,10C 44.4758,6.7715 51.8091,5.2715 59.5,5.5 Z" /></g>
                <g><path style="opacity:1" fill="#446fa1" d="M 59.5,5.5 C 87.1275,6.95499 104.961,20.955 113,47.5C 115.24,57.3463 114.74,67.013 111.5,76.5C 94.1807,71.1767 76.8474,65.8433 59.5,60.5C 59.5,42.1667 59.5,23.8333 59.5,5.5 Z" /></g>
                <g><path style="opacity:1" fill="#a7433d" d="M 59.5,60.5 C 76.8474,65.8433 94.1807,71.1767 111.5,76.5C 105.384,93.7824 93.7178,105.616 76.5,112C 52.7659,118.31 32.9326,112.144 17,93.5C 13.0956,88.3579 10.2623,82.6912 8.5,76.5C 25.4539,71.0117 42.4539,65.6783 59.5,60.5 Z" /></g>
            </svg>
        ),
    },
}

const STEP_TITLES = [
    t(msg => msg.dataManage.importOther.step1),
    t(msg => msg.dataManage.importOther.step2),
]

const dropdownCls = css`
    width: 100%;
    & .el-button-group {
        width: 100%;
        display: flex;
    }
    & .el-button-group > .el-button:first-child {
        flex: 1;
        min-width: 0;
    }
`

const _default = defineComponent(() => {
    const { refreshMemory } = useDataMemory()
    const [ext, setExt] = useState<OtherExtension>('webtime_tracker')
    useRequest(detectWatt, { onSuccess: v => v && setExt('web_activity_time_tracker') })
    const buttonText = computed(() => t(msg => msg.dataManage.restoreFromOther, { ext: EXTENSION_CONFIGS[ext.value].name }))

    const { step, open } = initDialogSopContext<ImportForm>({
        stepCount: 2,
        init: () => ({ ext: 'webtime_tracker', data: { rows: [], focus: true, time: true } }),
        onNext: async ({ form }) => {
            const file = form.file
            if (!file) throw new Error(t(msg => msg.dataManage.importOther.fileNotSelected))

            const data = await parseFile(form.ext, file)
            if (!data.rows.length) throw new Error("No rows parsed")
            form.data = data
        },
        onFinish: async ({ form }) => {
            const data = form.data
            if (!data) throw new Error(t(msg => msg.dataManage.importOther.fileNotSelected))
            const resolution = form.resolution
            if (!resolution) throw new Error(t(msg => msg.dataManage.importOther.conflictNotSelected))
            await importOther({ data: toRaw(data), resolution })
            refreshMemory?.()
        },
    })

    return () => <>
        <ElDropdown
            splitButton
            type='primary'
            size="large"
            class={dropdownCls}
            style={{ width: '100%' }}
            onCommand={(ext: OtherExtension) => setExt(ext)}
            onClick={() => open({ ext: ext.value, data: { rows: [], focus: true, time: true } })}
            v-slots={{
                dropdown: () => (
                    <ElDropdownMenu>
                        {Object.entries(EXTENSION_CONFIGS).map(([ext, config]) => (
                            <ElDropdownItem key={ext} command={ext}>
                                {config.name}
                            </ElDropdownItem>
                        ))}
                    </ElDropdownMenu>
                ),
            }}
        >
            <Flex gap={2} align='center'>
                <ElIcon size='1.4em'>{h(EXTENSION_CONFIGS[ext.value].Icon)}</ElIcon>
                <ElText truncated style={{ minWidth: 0, color: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}>{buttonText.value}</ElText>
            </Flex>
        </ElDropdown>
        <DialogSop title={buttonText.value} stepTitles={STEP_TITLES} width='80%' top="10vh">
            <Flex width="100%" justify="center">
                <Step1 v-show={step.value === 0} />
                <Step2 v-show={step.value === 1} />
            </Flex>
        </DialogSop>
    </>
})

export default _default