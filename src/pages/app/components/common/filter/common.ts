import { useCached, useState } from '@hooks'
import { watch, type StyleValue } from "vue"
import { useRoute } from 'vue-router'

export const SELECT_WRAPPER_STYLE: StyleValue = {
    width: '200px',
}

export type BaseFilterProps<T> = {
    defaultValue: T
    historyName?: string
    onChange?: ArgCallback<T>
}

export const useFilterState = <T>(item: string, props: BaseFilterProps<T>) => {
    const [data, setter] = props.historyName
        ? useCached(`__filter_item_${item}_${useRoute().path}_${props.historyName}`, props.defaultValue)
        : useState(props.defaultValue)
    props.onChange && watch(data, props.onChange, { immediate: true })

    return [data, setter] as const
}

export const ALL_BASE_FILTER_PROPS: readonly (keyof BaseFilterProps<unknown>)[] = ['defaultValue', 'historyName', 'onChange'] 