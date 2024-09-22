/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

// Time select
import { durationLabelOf } from "@popup/common"
import { ALL_POPUP_DURATION } from "@util/constant/popup"

const SELECTED_CLASS = 'selected'
class TimeSelectWrapper {
    private timeSelect: HTMLElement
    private timeSelectPopup: HTMLElement
    private timeSelectInput: HTMLInputElement
    private isOpen: boolean = false
    private currentSelected: PopupDuration = undefined
    private handleSelected: Function

    private optionList: HTMLElement
    private optionItems: Map<PopupDuration, HTMLLIElement> = new Map()

    constructor(handleSelected: Function) {
        this.handleSelected = handleSelected
    }

    async init(initialVal: PopupDuration): Promise<void> {
        this.timeSelect = document.getElementById('time-select-container')
        this.timeSelectPopup = document.getElementById('time-select-popup')
        this.timeSelectInput = document.getElementById('time-select-input') as HTMLInputElement
        this.optionList = document.getElementById('time-select-options')
        // Handle click
        this.timeSelect.onclick = () => this.isOpen ? this.hidePopup() : this.openPopup()
        // Init options
        ALL_POPUP_DURATION.forEach(duration => this.initOption(duration))
        // Set initial value
        this.selected(initialVal)
    }

    private initOption(item: PopupDuration) {
        const li = document.createElement('li')
        li.classList.add('el-select-dropdown__item')
        li.innerText = durationLabelOf(item)
        li.onclick = () => {
            this.selected(item)
            this.handleSelected?.()
            this.hidePopup()
        }
        this.optionList.append(li)
        this.optionItems.set(item, li)
    }

    private selected(item: PopupDuration) {
        this.currentSelected = item
        Array.from(this.optionItems.values()).forEach(item => item.classList.remove(SELECTED_CLASS))
        this.optionItems.get(item).classList.add(SELECTED_CLASS)
        this.timeSelectInput.value = durationLabelOf(item)
    }

    private openPopup() {
        this.timeSelectPopup.classList.remove("popup__hidden")
        this.timeSelectPopup.classList.add("popup__show")
        this.isOpen = true
    }

    private hidePopup() {
        this.timeSelectPopup.classList.remove("popup__show")
        this.timeSelectPopup.classList.add("popup__hidden")
        this.isOpen = false
    }

    getSelectedTime(): PopupDuration {
        return this.currentSelected
    }
}

export default TimeSelectWrapper