import { ElDivider } from 'element-plus'
import { type FunctionalComponent, h, isVNode, type VNode } from "vue"
import { isOptionItem } from './OptionItem'

function isComment({ type, children }: VNode): boolean {
    return typeof type === 'symbol' && (children === null || children === undefined)
}

function isHidden({ dirs }: VNode): boolean {
    return !!dirs?.some(({ dir, value }) => (dir as any)?.name === 'show' && value === false)
}

function flattenChildren(original: VNode[]): VNode[] {
    const flat: VNode[] = []
    const stack: unknown[] = [...original]

    let child: unknown | undefined
    while (child = stack.shift()) {
        if (!isVNode(child)) {
            console.log('Found non-VNode child, ignored:', child)
            continue
        }

        const { type, children } = child
        if (typeof type === 'symbol' && Array.isArray(children)) {
            // is Fragment, flatten it by pushing its children to stack
            stack.unshift(...children)
            continue
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
    return <div>{children}</div>
}
OptionLines.displayName = 'OptionLines'


export default OptionLines