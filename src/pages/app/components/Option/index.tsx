/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { MediaSize, useMediaSize } from "@hooks"
import { ElScrollbar } from 'element-plus'
import { defineComponent, ref, type Ref, type StyleValue } from "vue"
import { type JSX } from "vue/jsx-runtime"
import { type OptionCategory, type OptionInstance } from "./common"
import AccessibilityOption from "./components/AccessibilityOption"
import AppearanceOption from "./components/AppearanceOption"
import BackupOption from './components/BackupOption'
import LimitOption from './components/LimitOption'
import TrackingOption from "./components/TrackingOption"
import Select from "./Select"
import Tabs from "./Tabs"

const _default = defineComponent(() => {
    const paneRefMap: Record<OptionCategory, Ref<OptionInstance | undefined>> = {
        appearance: ref(),
        tracking: ref(),
        backup: ref(),
        limit: ref(),
        accessibility: ref(),
    }

    const mediaSize = useMediaSize()

    const slots: Record<OptionCategory, () => JSX.Element> = {
        appearance: () => <AppearanceOption ref={paneRefMap.appearance} />,
        tracking: () => <TrackingOption ref={paneRefMap.tracking} />,
        limit: () => <LimitOption ref={paneRefMap.limit} />,
        accessibility: () => <AccessibilityOption ref={paneRefMap.accessibility} />,
        backup: () => <BackupOption ref={paneRefMap.backup} />,
    }

    const handleReset = (cate: OptionCategory) => paneRefMap[cate]?.value?.reset?.()

    return () => (
        <ElScrollbar height="100%" style={{ width: '100%' } satisfies StyleValue}>
            {mediaSize.value <= MediaSize.sm
                ? <Select v-slots={slots} />
                : <Tabs onReset={handleReset} v-slots={slots} />}
        </ElScrollbar>
    )
})

export default _default