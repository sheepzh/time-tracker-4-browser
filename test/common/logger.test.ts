/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { closeLog, log, openLog } from "@/common/logger"

describe('common/logger', () => {
    test('openLog enables log output', () => {
        global.console.log = jest.fn()
        openLog()
        log("foobar")
        expect(console.log).toHaveBeenCalledWith("foobar")
    })

    test('closeLog disables log output', () => {
        global.console.log = jest.fn()
        closeLog()
        log("foobar")
        expect(console.log).toHaveBeenCalledTimes(0)
    })
})