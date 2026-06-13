import { injectGlobal } from '@emotion/css'

export const injectCommonCss = () => injectGlobal`
    body {
        margin: 0;
        background-color: var(--el-bg-color);
        font-family: 
            "Helvetica Neue", Helvetica, Arial, 
            "Segoe UI", "Roboto", 
            "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", 
            sans-serif;
    }

    html[data-theme='dark'] {
        --el-bg-color: var(--el-fill-color-dark);
        --el-fill-color-dark: #39393A;
    }
`