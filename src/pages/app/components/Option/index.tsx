/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { MediaSize, useMediaSize } from '@hooks'
import { ElScrollbar } from 'element-plus'
import { defineComponent, ref, type Ref, type StyleValue } from "vue"
import type { JSX } from "vue/jsx-runtime"
import { Accessibility, Appearance, Backup, type CategoryInstance, Limit, Notification, Tracking } from './categories'
import Select from "./Select"
import Tabs from "./Tabs"
import type { OptionCategory } from "./useCategory"

const _default = defineComponent(() => {
    const paneRefMap: Record<OptionCategory, Ref<CategoryInstance | undefined>> = {
        appearance: ref(),
        tracking: ref(),
        backup: ref(),
        limit: ref(),
        accessibility: ref(),
        notification: ref(),
    }

    const mediaSize = useMediaSize()

    const slots: Record<OptionCategory, () => JSX.Element> = {
        appearance: () => <Appearance ref={paneRefMap.appearance} />,
        tracking: () => <Tracking ref={paneRefMap.tracking} />,
        limit: () => <Limit ref={paneRefMap.limit} />,
        accessibility: () => <Accessibility ref={paneRefMap.accessibility} />,
        backup: () => <Backup ref={paneRefMap.backup} />,
        notification: () => <Notification ref={paneRefMap.notification} />,
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