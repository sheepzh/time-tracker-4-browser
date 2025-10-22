import { css } from '@emotion/css'
import { useNamespace } from 'element-plus'

export const useTabNav = (toolbarName: string) => {
    const ns = useNamespace('tabs')
    const toolbarClz = `tab-${toolbarName}`

    const tabsClz = css`
        .${ns.e('nav')} {
            width: 100%;
        }
        .${ns.e('content')} {
            margin: 22px 10px 10px;
            font-size: 14px;
        }
        #${toolbarClz} {
            position: absolute;
            right: 0;
        }
    `
    return { tabsClz }
}

export const useOptionLine = () => {
    const inputNs = useNamespace('input')
    const selectNs = useNamespace('select')
    const datePickerNs = useNamespace('date-editor')
    const tagNs = useNamespace('tag')

    const lineClz = css`
        .${inputNs.m('small')} {
            height: 28px;
        }
        .${inputNs.e('wrapper')} {
            height: 26px;
        }
    `
    const labelClz = css`
        float: left;
        line-height: 32px;
        color: var(--el-text-color-primary);
        i {
            margin: 0 2px;
            font-size: 13px !important;
        }
        .${selectNs.b()} {
            display: inline-flex;
            height: 28px;
            min-width: 120px;
            width: 120px;
        }
        .${selectNs.e('wrapper')} {
            width: 100%;
        }
        .${datePickerNs.m('time')} {
            width: 100px;
        }
        .${datePickerNs.m('time')} .${inputNs.e('prefix')} {
            width: 16px;
            margin-inline-start: 5px;
        }
    `
    const defaultClz = css`
        display: flex;
        color: var(--el-text-color-primary);
        .${tagNs.b()} {
            height: 20px;
            margin-inline-start: 4px;
        }
    `
    const requiredClz = css`
        color: var(--el-color-danger);
        margin-inline-end: 4px;
    `
    return { lineClz, labelClz, defaultClz, requiredClz }
}