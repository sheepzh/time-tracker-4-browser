import { sendMsg2Runtime } from '@api/sw/common'
import { t } from '@app/locale'
import { Refresh } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import { useOperation } from '@hooks'
import Flex from "@pages/components/Flex"
import { CloudSync, Json } from '@pages/icons'
import { IS_EDGE, IS_FIREFOX } from '@util/constant/environment'
import { type ButtonProps, ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElTabPane, ElTabs, useNamespace } from "element-plus"
import { defineComponent, type FunctionalComponent, h, ref, type Ref } from "vue"
import ContentContainer from '../common/ContentContainer'
import { CATE_CONFIG } from './categories'
import { confirmReload } from './categories/common'
import { createFileInput, exportSettings, importSettings } from "./export-import"
import type { CategoryInstance, OptionCategory } from './types'
import { useCategory } from './useCategory'

type DropButtonProps = ButtonProps & {
    options: { [label: string]: () => Awaitable<void> }
}

const DropButton: FunctionalComponent<DropButtonProps> = ({ options, ...buttonProps }) => (
    <ElDropdown v-slots={{
        default: () => <ElButton {...buttonProps} style={{ cursor: 'default' }} />,
        dropdown: () => <ElDropdownMenu>
            {Object.entries(options).map(([l, action]) => <ElDropdownItem onClick={action}>{l}</ElDropdownItem>)}
        </ElDropdownMenu>
    }} />
)

const useStyle = () => {
    const tabsNs = useNamespace('tabs')

    return css`
        & {
            .${tabsNs.e('item')} {
                font-size: 16px;
                height: 43px;
                line-height: 43px;
            }
            .${tabsNs.e('content')} {
                margin: 22px 10px 10px 10px;
                font-size: 14px;
            }
        }
    `
}

const judgeAccount = () => {
    if (IS_FIREFOX) {
        return 'Firefox Account'
    } else if (IS_EDGE) {
        return 'Microsoft Account'
    } else {
        return 'Chrome Account'
    }
}

const _default = defineComponent<{}>(() => {
    const { category, setCategory } = useCategory()
    const paneRefMap: Record<OptionCategory, Ref<CategoryInstance | undefined>> = {
        limit: ref(),
        appearance: ref(),
        tracking: ref(),
        accessibility: ref(),
        backup: ref(),
        notification: ref(),
    }

    const handleReset = () => paneRefMap[category.value].value?.reset()
    const handleExport = useOperation(exportSettings)
    const handleImport = useOperation(async () => {
        const fileContent = await createFileInput()
        // User cancelled, don't show error message
        if (!fileContent) return false
        await importSettings(fileContent)
    }, { onSuccess: confirmReload })
    const handleDownload = useOperation(() => sendMsg2Runtime('option.download'), { onSuccess: confirmReload })
    const handleSync = useOperation(() => sendMsg2Runtime('option.sync'))

    const cls = useStyle()
    const account = judgeAccount()

    return () => (
        <ContentContainer>
            <Flex justify='end' gap={5}>
                <DropButton type='warning' icon={CloudSync} options={{
                    [t(msg => msg.option.button.sync, { account })]: handleSync,
                    [t(msg => msg.option.button.download, { account })]: handleDownload,
                }} />
                <DropButton type='primary' icon={Json} options={{
                    [t(msg => msg.option.button.export)]: handleExport,
                    [t(msg => msg.option.button.import)]: handleImport,
                }} />
                <ElButton icon={Refresh} onClick={handleReset} type='danger'>
                    {t(msg => msg.option.button.reset)}
                </ElButton>
            </Flex>
            <ElTabs
                modelValue={category.value}
                class={cls}
                type='border-card'
                onTabChange={setCategory}
            >
                {Object.entries(CATE_CONFIG).map(([k, c]) => (
                    <ElTabPane name={k} label={t(c[0])} key={k} lazy>
                        {h(c[1], { ref: paneRefMap[k as OptionCategory] })}
                    </ElTabPane>
                ))}
            </ElTabs>
        </ContentContainer >
    )
})

export default _default
