export type OptionCategory = 'appearance' | 'tracking' | 'limit' | 'accessibility' | 'backup' | 'notification'

export interface CategoryInstance {
    reset(): Promise<void> | void
}
