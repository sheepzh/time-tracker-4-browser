import { IS_ANDROID } from "@util/constant/environment"
import { handleError } from "./common"

function onClick(id: string, handler: Function) {
    if (IS_ANDROID) {
        return
    }
    chrome.contextMenus?.onClicked?.addListener(({ menuItemId }) => menuItemId === id && handler?.())
}

export async function createContextMenu(props: ChromeContextMenuCreateProps): Promise<void> {
    const { id, onclick: clickHandler } = props
    if (IS_ANDROID || !id) {
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

export async function updateContextMenu(menuId: string, props: ChromeContextMenuUpdateProps): Promise<void> {
    if (IS_ANDROID) {
        return
    }
    return new Promise(resolve => chrome.contextMenus?.update?.(menuId, props, () => {
        handleError('updateContextMenu')
        resolve()
    }))
}