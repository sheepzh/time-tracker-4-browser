/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import resource from './time-format-resource.json'

export type TimeFormatMessage = { [key in timer.app.TimeFormat]: string }

const _default: Messages<TimeFormatMessage> = resource

export default _default