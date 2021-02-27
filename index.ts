import type { Dialog } from '@material/mwc-dialog'
import type { IconButton } from '@material/mwc-icon-button'
import type LitP2P from 'lit-p2p'
import type P2PSets from './p2p-sets.js'
import type LitSetsGame from '../src/sets.js'

import 'lit-p2p'                // <lit-p2p>
import '@mothepro/theme-toggle' // <theme-toggle>
import '@material/mwc-dialog'   // <mwc-dialog>
import './p2p-sets.js'          // <p2p-sets>

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<'accepted' | 'dismissed'>
  platforms: string[]
}

const // Elements in index.html
  serviceWorker = './sw.' + 'js', // for dev
  litP2pElement = document.querySelector('lit-p2p')! as LitP2P,
  p2pDemoElement = document.querySelector('p2p-sets')! as P2PSets,
  toggleOnlineBtns = document.querySelectorAll('[toggle-online]')! as unknown as IconButton[],
  hideOnTimerElements = document.querySelectorAll('[hidden-timer]')! as unknown as Element[],
  helpDialogElement = document.getElementById('help')! as Dialog,
  installBtn = document.querySelector('mwc-icon-button[icon=download]')!,
  dialogOpenerElements = document.querySelectorAll('[open-dialog]')! as unknown as IconButton[]

navigator?.serviceWorker.register(serviceWorker)

// first-visit attribute
if (localStorage.length)
  document.body.removeAttribute('first-visit')

// Remove easy mode
if (!document.body.hasAttribute('first-visit'))
  p2pDemoElement.removeAttribute('easy-mode')

// Auto connect
if (location.hash.includes('multiplayer'))
  litP2pElement.setAttribute('state', '')

// Hide some elements in offline mode
if (!navigator.onLine)
  document
    .querySelectorAll('[hide-offline]')
    .forEach(elem => elem.setAttribute('hidden', ''))

// Dialog openers
for (const opener of dialogOpenerElements)
  opener.addEventListener('click', () => document
    .getElementById(opener.getAttribute('open-dialog') ?? '')
    ?.toggleAttribute('open'))

// Make the toggle button actually do something
for (const toggleOnlineBtn of toggleOnlineBtns)
  toggleOnlineBtn.addEventListener('click', () => 
    litP2pElement.setAttribute('state', (litP2pElement.getAttribute('state') ?? '-1') == '-1' // is disconnected
      ? '' // try to connect
      : '-1')) // not trying to connect

// Add [open] to <mwc-dialog> after some time if first visit
if (document.body.hasAttribute('first-visit') && document.body.hasAttribute('first-visit-help-delay'))
  setTimeout(
    () => helpDialogElement.setAttribute('open', ''),
    parseInt(document.body.getAttribute('first-visit-help-delay') ?? ''))

let times = 0
if (document.body.hasAttribute('hidden-timer-interval'))
  setInterval(() => {
    times++
    for (const elem of hideOnTimerElements)
      elem.toggleAttribute('transparent', times % hideOnTimerElements.length != parseInt(elem.getAttribute('hidden-timer')!))
  }, parseInt(document.body.getAttribute('hidden-timer-interval')!))

// Difficulty Change switches online lobbies
// const lobbyPrefix = litP2pElement.getAttribute('lobby') ?? '',
//   standardDifficultySuffix = '-standard-'
// p2pDemoElement.addEventListener('difficulty', () => 
//   litP2pElement.setAttribute('lobby', p2pDemoElement.hasAttribute('easy-mode')
//     ? lobbyPrefix
//     : lobbyPrefix + standardDifficultySuffix))

// Key shortcuts
addEventListener('keypress', (event: KeyboardEvent) => {
  // Get at runtime since it may not always exist
  const setsGameElement = p2pDemoElement.shadowRoot?.querySelector('lit-sets') as LitSetsGame | null
  switch (event.key) {
    case '?': // Show help
      helpDialogElement.toggleAttribute('open')
      break
      
    case 'c': // Show clock
      p2pDemoElement.toggleAttribute('show-clock')
      break
    
    case 'Enter': // Take set
      if (setsGameElement) {
        event.preventDefault() // Don't select card that is currently focuesed
        setsGameElement.takeSet()
      }
      break
    
    case 'h': // Take Hint
      // TODO this will also take a hint even if you're typing your name!!
      setsGameElement?.takeHint()
      break
    
    case 'r': // Rearrange
      setsGameElement?.rearrange()
      break
  }
})

// Initialize `deferredPrompt` for use later to show browser install prompt.
let deferredPrompt: BeforeInstallPromptEvent | void

addEventListener('beforeinstallprompt', event => {
  // event.preventDefault() // should do this?
  deferredPrompt = event as BeforeInstallPromptEvent
  installBtn.removeAttribute('hidden')
  if ('ga' in window)
    ga('send', 'event', {
      eventCategory: 'install',
      eventAction: 'prompt',
      // eventLabel,
      // eventValue,
      nonInteraction: true,
    })
})

installBtn.addEventListener('click', async () => {
  let outcome = 'none'
  installBtn.toggleAttribute('hidden')
  if (deferredPrompt) {
    deferredPrompt.prompt()
    outcome = await deferredPrompt.userChoice
  }
  if ('ga' in window)
    ga('send', 'event', {
      eventCategory: 'install',
      eventAction: 'button',
      eventLabel: outcome,
      // eventValue,
    })
  deferredPrompt = undefined;
});

addEventListener('appinstalled', () => {
  deferredPrompt = undefined
  if ('ga' in window)
    ga('send', 'event', {
      eventCategory: 'install',
      eventAction: 'complete',
      // eventLabel,
      // eventValue,
    })
})

// Event logging
if ('ga' in window)
  // @ts-ignore Event listerner types are garbage
  addEventListener('p2p-error', ({ error }: ErrorEvent) =>
    ga('send', 'event', {
      eventCategory: 'error',
      eventAction: error.message,
      eventLabel: error.stack,
      // eventValue,
      nonInteraction: true,
    }))

// @ts-ignore Error logging - Event listerner types are garbage
addEventListener('p2p-error', ({ error }: ErrorEvent) => console.error('P2P connection failed', error))
