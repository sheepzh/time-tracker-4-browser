import { useXsState } from '@hooks'
import type { DescriptionProps } from 'element-plus'
import { computed, type CSSProperties } from 'vue'

export const useDescriptions = () => {
    const isXs = useXsState()
    return computed<{ style: CSSProperties, size: DescriptionProps['size'] }>(() => ({
        style: { width: isXs.value ? '90vw' : '400px' },
        size: isXs.value ? 'small' : undefined,
    }))
}