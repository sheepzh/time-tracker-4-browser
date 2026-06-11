export const ALL_FOCUS_MODES: tt4b.focus.Mode[] = ['allow', 'block']
export const ALL_FOCUS_TEMPLATES: tt4b.focus.Template[] = ['focus', 'pomodoro']

type TemplateDefault = MakeOptionalUndefined<Pick<tt4b.focus.Config, 'mode' | 'cond' | 'duration' | 'break' | 'allowDelay'>>
export const FOCUS_TEMPLATE_DEFAULTS: Record<tt4b.focus.Template, TemplateDefault> = {
    focus: {
        mode: 'allow', cond: [], allowDelay: false,
        duration: 25 * 60, break: undefined,
    },
    pomodoro: {
        mode: 'block', cond: [], allowDelay: undefined,
        duration: 45 * 60, break: 10 * 60,
    },
}

export const FOCUS_COND_PLACEHOLDER: Record<tt4b.focus.Mode, string> = {
    allow: 'e.g. www.github.com, www.reddit.com/r/chrome/**',
    block: 'e.g. www.facebook.com, *.twitter.com, youtube.com',
}