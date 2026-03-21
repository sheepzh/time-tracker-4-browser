import { injectGlobal } from '@emotion/css'

export const injectElementCss = () => {
    injectGlobal`
        // Fix select-v2
        .el-vl__window.el-select-dropdown__list {
            direction: unset !important;
        }

        // Fix header icon not align
        .el-table__header tr .cell {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .el-table__cell .cell {
            .el-input {
                height: 28px;
            }
            .el-input-group__append {
                padding: 0 4px;
            }
            .el-input-group--append {
                .el-input__wrapper {
                    height: 28px;
                }
                .el-input__inner {
                    padding-inline: 5px;
                }
            }
            .el-button [class*="el-icon-"] + span {
                margin-inline-start: 5px !important;
            }
        }
    `
}