type RequiredMessages<M> = {
    [locale in timer.RequiredLocale]: M
}

type OptionalMessages<M> = {
    [locale in timer.OptionalLocale]?: EmbeddedPartial<M>
}

type Messages<M> = RequiredMessages<M> & OptionalMessages<M>
