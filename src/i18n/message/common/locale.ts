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
type LocaleMessages =
    {
        [locale in tt4b.Locale]: Meta
    } & {
        [translatingLocale in tt4b.TranslatingLocale]: MetaBase
    }

const _default: LocaleMessages = resource

export default _default