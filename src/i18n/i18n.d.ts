type RequiredMessages<M> = {
    [locale in tt4b.RequiredLocale]: M
}

type OptionalMessages<M> = {
    [locale in tt4b.OptionalLocale]?: EmbeddedPartial<M>
}

type Messages<M> = RequiredMessages<M> & OptionalMessages<M>
