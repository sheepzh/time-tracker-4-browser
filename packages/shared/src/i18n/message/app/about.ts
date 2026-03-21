/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './about-resource.json'

export type AboutMessage = {
    label: {
        name: string
        version: string
        website: string
        installation: string
        thanks: string
        privacy: string
        license: string
        support: string
    },
    text: {
        greet: string
        rate: string
        feedback: string
    }
}

const _default: Messages<AboutMessage> = resource

export default _default