/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

// Generate the messages used by Chrome
function compile(obj: any, parentKey = ''): any {
    const result: any = {}
    if (typeof obj === 'object') {
        for (const key in obj) {
            const val = obj[key]
            // key of Chrome message
            const messageKey = !!parentKey ? `${parentKey}_${key}` : key
            const children = compile(val, messageKey)
            // copy from child
            for (const childKey in children) {
                result[childKey] = children[childKey]
            }
        }
    } else if (parentKey) {
        result[parentKey] = {
            message: obj + '',
            description: 'None'
        }
    }
    return result
}

export default compile