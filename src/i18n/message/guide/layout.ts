/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

export type LayoutMessage = {
    header: {
        sourceCode: string
        email: string
    }
    menu: {
        usage: string
    }
}

const _default: Messages<LayoutMessage> = {
    zh_CN: {
        header: {
            sourceCode: '查看源代码',
            email: '联系作者',
        },
        menu: {
            usage: '高级用法'
        },
    },
    zh_TW: {
        header: {
            sourceCode: '查看源代碼',
            email: '聯繫作者',
        },
        menu: {
            usage: '高級用法',
        },
    },
    en: {
        header: {
            sourceCode: 'View source code',
            email: 'Contact author'
        },
        menu: {
            usage: 'Advanced usages',
        },
    },
    ja: {
        header: {
            sourceCode: 'ソースコードを見る',
            email: '著者に連絡する',
        },
        menu: {
            usage: '高度な使い方',
        },
    },
}

export default _default