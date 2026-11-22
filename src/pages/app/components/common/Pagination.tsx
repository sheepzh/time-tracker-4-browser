/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { localReactive } from '@hooks'
import { Flex } from '@pages/components'
import { getPaginationIconProps } from "@pages/element-ui/rtl"
import { ElPagination } from "element-plus"
import { createObjectGuard, isInt } from 'typescript-guard'
import type { FunctionalComponent } from 'vue'

type Props = {
    disabled?: boolean
    defaultValue?: tt4b.common.PageQuery
    total?: number
    onChange?: (val: tt4b.common.PageQuery) => void
}

const Pagination: FunctionalComponent<Props> = props => (
    <Flex justify="center" align="center">
        <ElPagination
            disabled={props.disabled}
            {...getPaginationIconProps()}
            pageSizes={[10, 20, 50]}
            defaultCurrentPage={props.defaultValue?.num}
            defaultPageSize={props.defaultValue?.size}
            layout="total, sizes, prev, pager, next, jumper"
            total={props.total}
            onChange={(num, size) => props.onChange?.({ num, size })}
        />
    </Flex>
)
Pagination.displayName = 'Pagination'

export default Pagination

const isValidCache = createObjectGuard({ size: isInt })
export const useStoredPage = (storeKey: string) => localReactive<tt4b.common.PageQuery, 'size'>(
    `pagination_${storeKey}`, isValidCache, { size: 20 }, { num: 1 },
)