import { playFocusSound } from '@util/focus-sound'
import Dispatcher from './dispatcher'

const dispatcher = new Dispatcher()

dispatcher.register('playFocusSound', notice => playFocusSound(notice))

export default dispatcher
