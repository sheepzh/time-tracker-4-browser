import { IS_MOBILE } from "@util/constant/environment"
import { handleError } from "./common"

function onClick(id: string, handler: Function) {
    if (IS_MOBILE) {
        return
    }
    chrome.contextMenus?.onClicked?.addListener(({ menuItemId }) => menuItemId === id && handler?.())
}

export async function createContextMenu(props: ChromeContextMenuCreateProps): Promise<void> {
    const { id, onclick: clickHandler } = props
    if (IS_MOBILE || !id) {
        return
    }
    // Add listener by param
    delete props.onclick

    return new Promise(resolve => chrome.contextMenus?.create?.(props, () => {
        handleError('createContextMenu')
        clickHandler && onClick(id, clickHandler)
        resolve()
    }))
}
