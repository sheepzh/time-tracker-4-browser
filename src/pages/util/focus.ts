export const ALL_FOCUS_POLICIES: tt4b.focus.FilterPolicy[] = ['allow', 'block']

type MethodDefault = MakeOptionalUndefined<Pick<tt4b.focus.Config, 'policy' | 'cond' | 'duration' | 'break' | 'allowDelay'>>
export const FOCUS_METHOD_DEFAULTS: Record<tt4b.focus.Method, MethodDefault> = {
    focus: {
        policy: 'allow', cond: [], allowDelay: false,
        duration: 25 * 60, break: undefined,
    },
    pomodoro: {
        policy: 'block', cond: [], allowDelay: undefined,
        duration: 45 * 60, break: 10 * 60,
    },
}

export const FOCUS_COND_PLACEHOLDER: Record<tt4b.focus.FilterPolicy, string> = {
    allow: 'e.g. www.github.com, www.reddit.com/r/chrome/**',
    block: 'e.g. www.facebook.com, *.twitter.com, youtube.com',
}