import { FOCUS_POPUP_DURATION_MS, FOCUS_SOUND_URL, playFocusSound } from '@util/focus-sound'

test('FOCUS_SOUND_URL', () => {
    expect(FOCUS_SOUND_URL).toBe('static/sounds/relentless.wav')
})

test('FOCUS_POPUP_DURATION_MS', () => {
    expect(FOCUS_POPUP_DURATION_MS).toBe(3000)
})

test('playFocusSound is exported', () => {
    expect(typeof playFocusSound).toBe('function')
})
