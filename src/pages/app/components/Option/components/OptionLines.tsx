import { ElDivider } from 'element-plus'
import { type FunctionalComponent, h, isVNode, type VNode } from "vue"
import { isOptionItem } from './OptionItem'

function isFragment({ type, children }: VNode): boolean {
    return typeof type === 'symbol' && Array.isArray(children)
}

function isComment({ type, children }: VNode): boolean {
    return typeof type === 'symbol' && (children === null || children === undefined)
}

function isHidden({ dirs }: VNode): boolean {
    return !!dirs?.some(({ dir, value }) => (dir as any)?.name === 'show' && value === false)
}

function flattenChildren(original: VNode[]): VNode[] {
    const flat: VNode[] = []

    for (const child of original) {
        if (!isVNode(child)) {
            flat.push(child)
            continue
        }

        if (isFragment(child) && child.children) {
            const fragmentChildren = Array.isArray(child.children)
                ? child.children
                : [child.children]
            flat.push(...flattenChildren(fragmentChildren as VNode[]))
        } else {
            flat.push(child)
        }
    }
    return flat
}

const OptionLines: FunctionalComponent<{}> = (_, { slots }) => {
    const children: VNode[] = []

    let beforeIsItem = false
    for (const child of flattenChildren(slots.default?.() ?? [])) {
        if (isComment(child) || isHidden(child)) {
            // ignore these components
            children.push(child)
            continue
        }
        const thisIsItem = isOptionItem(child)
        thisIsItem && beforeIsItem && children.push(h(ElDivider))
        children.push(child)
        beforeIsItem = thisIsItem
    }

    return h('div', {}, children)
}
OptionLines.displayName = 'OptionLines'


export default OptionLines