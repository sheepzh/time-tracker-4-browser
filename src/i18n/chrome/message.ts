/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import metaMessages, { type MetaMessage } from "../message/common/meta"
import { merge, type MessageRoot } from "../message/merge"

type ChromeMessage = {
    meta: MetaMessage
}

const MESSAGE_ROOT: MessageRoot<ChromeMessage> = {
    meta: metaMessages,
}

const messages = merge<ChromeMessage>(MESSAGE_ROOT)

export default messages
