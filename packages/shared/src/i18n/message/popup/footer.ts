/**
 * Copyright (c) 2025 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type PopupRoute } from '@popup/router'
import resource from './footer-resource.json'

export type FooterMessage = {
    route: Record<PopupRoute, string>
}

const footerMessages = resource satisfies Messages<FooterMessage>

export default footerMessages