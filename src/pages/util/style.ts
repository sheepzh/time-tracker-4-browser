/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { camelize, type CSSProperties } from "vue"

type Variant = "primary" | "success" | "warning" | "info" | "danger"

type ColorUsage = 'fill'

export const colorVariant = (variant: Variant) => `--el-color-${variant}`

export const colorUsage = (usage: ColorUsage) => `--el-${usage}-color`

export const getStyle = (
    element: HTMLElement,
    styleName: keyof CSSProperties
): string => {
    if (!element || !styleName) return ''

    let key = camelize(styleName)
    if (key === 'float') key = 'cssFloat'
    try {
        const style = (element.style as any)[key]
        if (style) return style
        const computed: any = document.defaultView?.getComputedStyle(element, '')
        return computed ? computed[key] : ''
    } catch {
        return (element.style as any)[key]
    }
}

export function getCssVariable(varName: string, eleOrSelector?: HTMLElement | string): string | undefined {
    const ele = typeof eleOrSelector === 'string' ? document.querySelector(eleOrSelector) : eleOrSelector
    const realEle = ele ?? document.documentElement
    if (!realEle) {
        return undefined
    }
    return getComputedStyle(realEle).getPropertyValue(varName)
}

export function getPrimaryTextColor(): string | undefined {
    return getCssVariable("--el-text-color-primary")
}

export function getRegularTextColor(): string | undefined {
    return getCssVariable("--el-text-color-regular")
}

export function getSecondaryTextColor(): string | undefined {
    return getCssVariable("--el-text-color-secondary")
}

export function getInfoColor(): string | undefined {
    return getCssVariable(colorVariant('info'))
}
