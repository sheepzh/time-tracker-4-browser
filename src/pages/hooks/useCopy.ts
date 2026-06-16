import { Check, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

export const useCopy = (text: MaybeRefOrGetter<string>) => {
    const copied = ref(false)
    const icon = computed(() => copied.value ? Check : CopyDocument)
    const copy = async () => {
        if (copied.value) return
        try {
            const value = toValue(text)
            await navigator.clipboard.writeText(value)
            copied.value = true
            setTimeout(() => copied.value = false, 1000)
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : e ?? 'Unknown error'
            ElMessage.error(`Copy failed: ${errMsg}`)
        }
    }

    return { copied, icon, copy }
}