/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './initial-resource.json'

/**
 * Locales for initial data
 * 
 * @since 0.9.1
 */
export type InitialMessage = {
    localFile: {
        json: string
        pic: string
        pdf: string
        txt: string
    }
}

const _default: Messages<InitialMessage> = resource

export default _default