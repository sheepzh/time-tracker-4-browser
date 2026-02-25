import optionHolder from '@service/components/option-holder'

export class StorageHolder<Database> {
    current: Database
    delegates: Record<timer.option.StorageType, Database>

    constructor(delegates: Record<timer.option.StorageType, Database>) {
        this.delegates = delegates
        this.current = delegates.classic

        optionHolder.get().then(val => this.handleOption(val))
        optionHolder.addChangeListener(val => this.handleOption(val))
    }

    private handleOption(option: timer.option.TrackingOption) {
        const delegate = this.delegates[option.storage]
        delegate && (this.current = delegate)
    }

    get(type: timer.option.StorageType): Database | null {
        return this.delegates[type] ?? null
    }
}