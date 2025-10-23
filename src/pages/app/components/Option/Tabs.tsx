import { t } from "@app/locale"
import { Download, Refresh, Upload } from "@element-plus/icons-vue"
import Flex from "@pages/components/Flex"
import { ElLink, ElMessage, ElMessageBox, ElTabPane, ElTabs, ElTooltip, TabPaneName } from "element-plus"
import { defineComponent, h, ref, useSlots } from "vue"
import { useRouter } from "vue-router"
import ContentContainer from "../common/ContentContainer"
import { CATE_LABELS, changeQuery, type OptionCategory, parseQuery } from "./common"
import { createFileInput, exportSettings, importSettings } from "./export-import"

const TOOLBAR_NAME = "toolbar"

type TooltipProps = {
    onReset?: NoArgCallback
}

const Toolbar = defineComponent<TooltipProps>(props => {
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

    return () => (
        <Flex align="center" gap={10} onClick={ev => ev.stopPropagation()}>
            <ElTooltip content={t(msg => msg.option.exportButton)}>
                <ElLink
                    icon={Download}
                    underline="never"
                    onClick={handleExport}
                />
            </ElTooltip>
            <ElTooltip content={t(msg => msg.option.importButton)}>
                <ElLink
                    icon={Upload}
                    underline="never"
                    onClick={handleImport}
                />
            </ElTooltip>
            <ElLink icon={Refresh} underline="never" onClick={props.onReset}>
                {t(msg => msg.option.resetButton)}
            </ElLink>
        </Flex>
    )
}, {
    props: ['onReset']
})

type Props = { onReset: (cate: OptionCategory) => Promise<void> | void }

const _default = defineComponent<Props>(props => {
    const tab = ref(parseQuery() ?? 'appearance')
    const router = useRouter()
    const handleReset = () => props.onReset?.(tab.value)

    const handleBeforeLeave = (activeName: TabPaneName): Promise<boolean> => {
        if (activeName === TOOLBAR_NAME) {
            // do nothing, and never happen
            return Promise.reject()
        }
        const cate = activeName as OptionCategory
        tab.value = cate
        // Change the query of current route
        changeQuery(cate, router)
        return Promise.resolve(true)
    }
    return () => (
        <ContentContainer>
            <ElTabs
                modelValue={tab.value}
                type="border-card"
                beforeLeave={handleBeforeLeave}
                class="option-tab"
            >
                {Object.entries(useSlots()).filter(([key]) => key !== 'default').map(([key, slot]) => (
                    <ElTabPane name={key} label={t(CATE_LABELS[key as OptionCategory])}>
                        {!!slot && h(slot)}
                    </ElTabPane>
                ))}
                <ElTabPane
                    name={TOOLBAR_NAME}
                    v-slots={{ label: () => <Toolbar onReset={handleReset} /> }}
                />
            </ElTabs>
        </ContentContainer>
    )
}, { props: ['onReset'] })

export default _default