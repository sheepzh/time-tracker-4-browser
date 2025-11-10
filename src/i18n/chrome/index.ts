/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * @ts error Can't find namespace timer in this file
 * So import the faked one
 */
import { FakedLocale } from ".."
import compile from "./compile"
import messages from "./message"

const _default: { [locale in FakedLocale]: any } = {
    zh_CN: compile(messages.zh_CN),
    zh_TW: compile(messages.zh_TW),
    en: compile(messages.en),
    ja: compile(messages.ja),
    pt_PT: compile(messages.pt_PT),
    uk: compile(messages.uk),
    es: compile(messages.es),
    de: compile(messages.de),
    fr: compile(messages.fr),
    ru: compile(messages.ru),
    ar: compile(messages.ar),
    tr: compile(messages.tr),
    pl: compile(messages.pl),
}

export default _default