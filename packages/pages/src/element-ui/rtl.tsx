import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from "@element-plus/icons-vue"
import { isRtl } from "@util/document"
import { ElIcon } from "element-plus"
import { VNode } from "vue"

export const getDatePickerIconSlots = () => {
    const rtl = isRtl()
    if (!rtl) return {}
    return {
        "prev-month": () => <ElIcon><ArrowRight /></ElIcon>,
        "prev-year": () => <ElIcon><DArrowRight /></ElIcon>,
        "next-month": () => <ElIcon><ArrowLeft /></ElIcon>,
        "next-year": () => <ElIcon><DArrowLeft /></ElIcon>,
    }
}

export const getPaginationIconProps = (): {
    prevIcon?: VNode
    nextIcon?: VNode
} => {
    if (!isRtl()) return {}
    return {
        prevIcon: <ElIcon><ArrowRight /></ElIcon>,
        nextIcon: <ElIcon><ArrowLeft /></ElIcon>,
    }
}