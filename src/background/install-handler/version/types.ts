/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Processor for version
 *
 * @since 0.1.2
 */
export interface Migrator {
    onInstall(): void

    onUpdate(version: string): void
}