import { useCategories } from "@app/context"
import { t } from "@app/locale"
import { Check, Close, Plus } from "@element-plus/icons-vue"
import { useManualRequest, useState, useSwitch } from "@hooks"
import Flex from "@pages/components/Flex"
import cateService from "@service/cate-service"
import { stopPropagationAfter } from "@util/document"
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from "element-plus"
import { defineComponent, nextTick, ref } from "vue"

const SelectFooter = defineComponent(() => {
    const { refreshCategories } = useCategories()
    const [editing, openEditing, closeEditing] = useSwitch(false)
    const [name, setName] = useState<string>()

    const { refresh: saveCate, loading } = useManualRequest(
        (name: string) => cateService.add(name),
        {
            onSuccess() {
                refreshCategories?.()
                closeEditing()
                setName()
            }
        }
    )

    const onConfirm = () => {
        let nameVal = name?.value?.trim?.()
        if (!nameVal) {
            ElMessage.warning("Name is empty")
            return
        }
        saveCate(nameVal)
    }

    const inputRef = ref<HTMLInputElement>()

    const onNewClick = () => {
        openEditing()
        nextTick(() => inputRef.value?.focus?.())
    }

    return () => (
        <Flex column>
            {editing.value ? <>
                <ElForm
                    size="small"
                    labelPosition="right"
                    labelWidth={60}
                    disabled={loading.value}
                >
                    <ElFormItem label={t(msg => msg.siteManage.cate.name)} required>
                        <ElInput
                            ref={inputRef}
                            size="small"
                            modelValue={name.value}
                            onInput={setName}
                            onKeydown={ev => {
                                const { key } = ev as KeyboardEvent
                                if (key === 'Escape') {
                                    stopPropagationAfter(ev, closeEditing)
                                } else if (key === 'Enter') {
                                    stopPropagationAfter(ev, onConfirm)
                                }
                            }}
                        />
                    </ElFormItem>
                </ElForm>
                <Flex width="100%" justify="end">
                    <ElButton
                        size="small"
                        disabled={loading.value}
                        icon={Close}
                        onClick={closeEditing}
                    >
                        {t(msg => msg.button.cancel)}
                    </ElButton>
                    <ElButton
                        size="small"
                        type="primary"
                        icon={Check}
                        onClick={onConfirm}
                        loading={loading.value}
                    >
                        {t(msg => msg.button.confirm)}
                    </ElButton>
                </Flex>
            </> : (
                <Flex width="100%" justify="end">
                    <ElButton size="small" icon={Plus} type="success" onClick={onNewClick}>
                        {t(msg => msg.button.create)}
                    </ElButton>
                </Flex>
            )}
        </Flex>
    )
})

export default SelectFooter