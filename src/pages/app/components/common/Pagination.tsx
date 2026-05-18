/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import Flex from "@pages/components/Flex"
import { getPaginationIconProps } from "@pages/element-ui/rtl"
import { ElPagination } from "element-plus"
import { defineComponent } from "vue"

type Props = {
    disabled?: boolean
    defaultValue?: tt4b.common.PageQuery
    total?: number
    onChange?: (val: tt4b.common.PageQuery) => void
}

const Pagination = defineComponent<Props>(props => {
    return () => (
        <Flex justify="center" align="center">
            <ElPagination
                disabled={props.disabled}
                {...getPaginationIconProps()}
                pageSizes={[10, 20, 50]}
                defaultCurrentPage={(props.defaultValue as tt4b.common.PageQuery)?.num}
                defaultPageSize={(props.defaultValue as tt4b.common.PageQuery)?.size}
                layout="total, sizes, prev, pager, next, jumper"
                total={props.total}
                onChange={(currentPage, pageSize) => props.onChange?.({ num: currentPage, size: pageSize })}
            />
        </Flex>
    )
}, { props: ['total', 'onChange', 'defaultValue'] })

export default Pagination