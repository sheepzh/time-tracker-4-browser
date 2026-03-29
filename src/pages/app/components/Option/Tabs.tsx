import { t } from '@app/locale'
import { Download, Refresh, Upload } from "@element-plus/icons-vue"
import { css } from '@emotion/css'
import Flex from "@pages/components/Flex"
import { ElButton, ElMessage, ElMessageBox, ElTabPane, ElTabs, TabPaneName, useNamespace } from "element-plus"
import { defineComponent, h, useSlots } from "vue"
import ContentContainer from '../common/ContentContainer'
import { createFileInput, exportSettings, importSettings } from "./export-import"
import { type OptionCategory, useCategory } from './useCategory'

const handleExport = async () => {
    try {
        await exportSettings()
        ElMessage.success(t(msg => msg.option.exportSuccess))
    } catch (error) {
        ElMessage.error('Export failed: ' + (error as Error).message)
    }
}

const handleImport = async () => {
    try {
        const fileContent = await createFileInput()
        // User cancelled, don't show error message
        if (!fileContent) return
        await importSettings(fileContent)
        ElMessageBox({
            message: t(msg => msg.option.importConfirm),
            type: "success",
            confirmButtonText: t(msg => msg.option.reloadButton),
            closeOnPressEscape: false,
            closeOnClickModal: false
        }).then(() => {
            window.location.reload()
        }).catch(() => {/* do nothing */ })
    } catch (error) {
        ElMessage.error(t(msg => msg.option.importError))
    }
}

type Props = { onReset: (category: OptionCategory) => Promise<void> | void }

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

const _default = defineComponent<Props>(props => {
    const { category, setCategory, getLabel } = useCategory()

    const handleReset = () => props.onReset?.(category.value)

    const handleBeforeLeave = (activeName: TabPaneName): Promise<boolean> => {
        setCategory(activeName)
        return Promise.resolve(true)
    }

    const cls = useStyle()

    return () => (
        <ContentContainer>
            <Flex justify='end' gap={5}>
                <ElButton icon={Download} onClick={handleExport} type='primary'>
                    {t(msg => msg.option.exportButton)}
                </ElButton>
                <ElButton icon={Upload} onClick={handleImport} type='primary'>
                    {t(msg => msg.option.importButton)}
                </ElButton>
                <ElButton icon={Refresh} onClick={handleReset} type='danger'>
                    {t(msg => msg.option.resetButton)}
                </ElButton>
            </Flex>
            <ElTabs
                modelValue={category.value}
                class={cls}
                type='border-card'
                onTabChange={setCategory}
            >
                {Object.entries(useSlots()).filter(([key]) => key !== 'default').map(([key, slot]) => (
                    <ElTabPane name={key} label={getLabel(key)}>
                        {!!slot && h(slot)}
                    </ElTabPane>
                ))}
            </ElTabs>
        </ContentContainer>
    )
}, { props: ['onReset'] })

export default _default
