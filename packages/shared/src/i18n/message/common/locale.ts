/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './locale-resource.json'

type MetaBase = {
    name: string
}

type Meta = MetaBase & {
    comma: string
}

/**
 * Meta info of locales
 *
 * @since 0.8.0
 */
export type LocaleMessages =
    {
        [locale in timer.Locale]: Meta
    } & {
        [translatingLocale in timer.TranslatingLocale]: MetaBase
    }

const _default: LocaleMessages = resource

export default _default