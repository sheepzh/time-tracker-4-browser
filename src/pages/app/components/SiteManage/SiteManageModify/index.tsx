/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import siteDatabase from '@db/site-database'
import { Check } from "@element-plus/icons-vue"
import { useSwitch } from "@hooks"
import { addSite } from "@service/site-service"
import { supportCategory } from "@util/site"
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage, type FormInstance, type FormItemRule } from "element-plus"
import { computed, defineComponent, reactive, ref } from "vue"
import CategorySelect from "../../common/category/CategorySelect"
import HostSelect from "./HostSelect"

export type ModifyInstance = {
    add(): void
}

type _FormData = {
    /**
     * Value of alias key
     */
    key: timer.site.SiteKey | undefined
    alias: string | undefined
    category: number | undefined
}

const formRule: Record<string, FormItemRule | FormItemRule[]> = {
    alias: {
        required: true,
        message: t(msg => msg.siteManage.form.emptyAlias),
        trigger: 'blur',
    },
    key: {
        required: true,
        message: t(msg => msg.siteManage.form.emptyHost),
        trigger: 'blur',
    },
}

function validateForm(form: FormInstance | undefined): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        const validate = form?.validate
        validate
            ? validate((valid: boolean) => valid ? resolve(true) : resolve(false))
            : reject(false)
    })
}

async function handleAdd(siteInfo: timer.site.SiteInfo): Promise<boolean> {
    const existed = await siteDatabase.exist(siteInfo)
    if (existed) {
        ElMessage({
            type: 'warning',
            message: t(msg => msg.siteManage.msg.hostExistWarn, { host: siteInfo.host }),
            showClose: true,
            duration: 1600
        })
    } else {
        await addSite(siteInfo)
    }
    return !existed
}

const initData = (): _FormData => ({
    key: undefined,
    alias: undefined,
    category: undefined,
})

const _default = defineComponent<{ onSave: NoArgCallback }>((props, ctx) => {
    const [visible, open, close] = useSwitch()
    const formData = reactive(initData())
    const showCate = computed(() => supportCategory(formData.key))
    const form = ref<FormInstance>()

    const add = () => {
        formData.key = formData.alias = undefined
        open()
    }
    ctx.expose({ add } satisfies ModifyInstance)

    const handleSave = async () => {
        const valid: boolean = await validateForm(form.value)
        if (!valid) return false

        let { key: siteKey, alias } = formData
        if (!siteKey) return false

        alias = alias?.trim()
        const siteInfo: timer.site.SiteInfo = { ...siteKey, alias, cate: formData.category }
        const saved = await handleAdd(siteInfo)
        if (saved) {
            close()
            ElMessage.success(t(msg => msg.operation.successMsg))
            props.onSave?.()
        }
    }

    return () => (
        <ElDialog
            width={450}
            title={t(msg => msg.button.create)}
            modelValue={visible.value}
            closeOnClickModal={false}
            onClose={close}
            v-slots={{
                footer: () => (
                    <ElButton type="primary" icon={Check} onClick={handleSave}>
                        {t(msg => msg.button.save)}
                    </ElButton>
                )
            }}
        >
            <ElForm model={formData} rules={formRule} ref={form}>
                <ElFormItem prop="key" label={t(msg => msg.item.host)}>
                    <HostSelect modelValue={formData.key} onChange={val => formData.key = val} />
                </ElFormItem>
                <ElFormItem prop="alias" label={t(msg => msg.siteManage.column.alias)}>
                    <ElInput
                        modelValue={formData.alias}
                        onInput={val => formData.alias = val}
                        onKeydown={ev => (ev as KeyboardEvent).key === "Enter" && handleSave()}
                    />
                </ElFormItem>
                {showCate.value && (
                    <ElFormItem prop="category" label={t(msg => msg.siteManage.column.cate)}>
                        <CategorySelect
                            clearable
                            modelValue={formData.category}
                            onChange={val => formData.category = val}
                        />
                    </ElFormItem>
                )}
            </ElForm>
        </ElDialog>
    )
}, { props: ['onSave'] })

export default _default
