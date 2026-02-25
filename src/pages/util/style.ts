/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { camelize, type CSSProperties } from "vue"

type Variant = "primary" | "success" | "warning" | "info" | "danger"

type TextVariant = "primary" | "regular" | "secondary"

type ColorUsage = 'fill'

export const colorVariant = (variant: Variant, effect?: 'dark' | 'light', level?: number) => {
    let res = `--el-color-${variant}`
    if (effect) {
        res += `-${effect}`
        if (level !== undefined) {
            res += `-${level}`
        }
    }
    return res
}

export const colorUsage = (usage: ColorUsage) => `--el-${usage}-color`

export const textColor = (variant: TextVariant) => `--el-text-color-${variant}`

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
    return getCssVariable(textColor("primary"))
}

export function getRegularTextColor(): string | undefined {
    return getCssVariable(textColor("regular"))
}

export function getSecondaryTextColor(): string | undefined {
    return getCssVariable(textColor("secondary"))
}

export function getInfoColor(): string | undefined {
    return getColor('info')
}

export function getColor(variant: Variant): string | undefined {
    return getCssVariable(colorVariant(variant))
}