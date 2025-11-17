import { t } from "@app/locale"
import { ElCol, ElForm, ElFormItem, ElInput, ElRow, ElSelect, ElSwitch } from "element-plus"
import { defineComponent } from "vue"
import { useSopData } from "./context"

const _default = defineComponent(() => {
    const data = useSopData()

    return () => (
        <ElForm labelWidth={130} labelPosition="left">
            <ElRow gutter={30}>
                <ElCol span={12}>
                    <ElFormItem label={t(msg => msg.limit.item.name)} required>
                        <ElInput
                            modelValue={data.name} onInput={val => data.name = val}
                            clearable onClear={() => data.name = ''}
                        />
                    </ElFormItem>
                </ElCol>
                <ElCol span={12}>
                    <ElFormItem label={t(msg => msg.limit.item.enabled)} required>
                        <ElSwitch modelValue={data.enabled} onChange={v => data.enabled = !!v} />
                    </ElFormItem>
                </ElCol>
            </ElRow>
            <ElRow>
                <ElCol span={24}>
                    <ElFormItem label={t(msg => msg.limit.item.effectiveDay)} required>
                        <ElSelect
                            multiple
                            modelValue={data.weekdays}
                            onChange={v => data.weekdays = v}
                            placeholder=""
                            options={t(msg => msg.calendar.weekDays).split('|').map((label, idx) => ({ value: idx, label }))}
                        />
                    </ElFormItem>
                </ElCol>
            </ElRow>
        </ElForm>
    )
})

export default _default