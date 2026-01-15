
import { t } from '@app/locale'
import { ElButton, ElDialog, ElFormItem, ElInput } from 'element-plus'
import { createVNode, defineComponent, reactive, ref, render } from 'vue'

type Props = {
    cate?: timer.site.Cate
    onClose?: NoArgCallback
    onSave?: (cate: timer.site.Cate) => void
}

const Component = defineComponent<Props>(props => {
    const visible = ref(true)
    const formData = reactive<Partial<timer.site.Cate>>({ ...props.cate })

    const handleConfirm = () => {

    }

    return () => (
        <ElDialog
            modelValue={visible.value}
            title={props.cate ? t(msg => msg.button.modify) : t(msg => msg.button.create)}
            width={400}
            destroyOnClose
            beforeClose={props.onClose}
            closeOnClickModal={false}
            v-slots={{
                footer: () => <>
                    <ElButton onClick={props.onClose}>{t(msg => msg.button.cancel)}</ElButton>
                    <ElButton type="primary" onClick={handleConfirm}>
                        {t(msg => msg.button.confirm)}
                    </ElButton>
                </>
            }}
        >
            <ElFormItem label={t(msg => msg.siteManage.cate.name)} prop="name">
                <ElInput v-model={formData.name} />
            </ElFormItem>
            <ElFormItem label={t(msg => msg.siteManage.cate.name)} prop="name">
                <ElInput v-model={formData.name} />
            </ElFormItem>
        </ElDialog>
    )
}, { props: ['cate', 'onClose', 'onSave'] })

interface DialogOptions {
    cate?: timer.site.Cate
}

function open(options: DialogOptions = {}): Promise<timer.site.Cate> {
    const { cate } = options

    return new Promise<timer.site.Cate>((resolve, reject) => {
        const container = document.createElement('div')
        document.body.appendChild(container)

        const cleanup = () => {
            render(null, container)
            document.body.removeChild(container)
        }

        const vnode = createVNode(Component, {
            cate,
            onClose: async (data: timer.site.Cate) => {
                try {
                    resolve(data)
                } catch (error) {
                    reject(error)
                } finally {
                    cleanup()
                }
            },
            onCancel: () => {
                reject()
                cleanup()
            }
        })

        render(vnode, container)
    })
}



type CategoryDialogDef = typeof Component & {
    open: typeof open
}

const CategoryDialog = Component as CategoryDialogDef
CategoryDialog.open = open

export default CategoryDialog