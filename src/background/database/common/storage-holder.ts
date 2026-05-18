import optionHolder from '@service/components/option-holder'

export class StorageHolder<Database> {
    current: Database
    delegates: Record<tt4b.option.StorageType, Database>

    constructor(delegates: Record<tt4b.option.StorageType, Database>) {
        this.delegates = delegates
        this.current = delegates.classic
        optionHolder.get().then(val => this.handleOption(val))
        optionHolder.addChangeListener(val => this.handleOption(val))
    }

    private handleOption(option: tt4b.option.TrackingOption) {
        const delegate = this.delegates[option.storage]
        delegate && (this.current = delegate)
    }

    get(type: tt4b.option.StorageType): Database | null {
        return this.delegates[type] ?? null
    }
}