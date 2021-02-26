import type { Dialog } from '@material/mwc-dialog'
import type { IconButton } from '@material/mwc-icon-button'
import type LitP2P from 'lit-p2p'
import type P2PSets from './p2p-sets.js'
import type LitSetsGame from '../src/sets.js'

import 'lit-p2p'                // <lit-p2p>
import '@mothepro/theme-toggle' // <theme-toggle>
import '@material/mwc-dialog'   // <mwc-dialog>
import './p2p-sets.js'          // <p2p-sets>

navigator?.serviceWorker.register(`./sw${'.'}js`)

const // Elements in index.html
  litP2pElement = document.querySelector('lit-p2p')! as LitP2P,
  p2pDemoElement = document.querySelector('p2p-sets')! as P2PSets,
  toggleOnlineBtns = document.querySelectorAll('[toggle-online]')! as unknown as IconButton[],
  hideOnTimerElements = document.querySelectorAll('[hidden-timer]')! as unknown as Element[],
  helpDialogElement = document.getElementById('help')! as Dialog,
  // installBtn = document.querySelector('mwc-icon-button[icon=download]')!,
  dialogOpenerElements = document.querySelectorAll('[open-dialog]')! as unknown as IconButton[]

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
      elem.toggleAttribute('hidden', times % hideOnTimerElements.length != parseInt(elem.getAttribute('hidden-timer')!))
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
  const setsGameElement = p2pDemoElement.shadowRoot?.querySelector('lit-sets') as LitSetsGame | void
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
      if (setsGameElement) {
        event.preventDefault()
        setsGameElement.takeHint()
      }
      break
    
    case 'r': // Rearrange
      if (setsGameElement) {
        event.preventDefault()
        setsGameElement.rearrange()
      }
      break
  }
})

// Initialize deferredPrompt for use later to show browser install prompt.
// let deferredPrompt: Event | void

// Go back offline
// document.querySelector('h1.title')?.addEventListener('click', () => litP2pElement.setAttribute('state', 'reset'))

// addEventListener('beforeinstallprompt', event => {
//   event.preventDefault()
//   deferredPrompt = event
//   installBtn.removeAttribute('hidden')
//   ga('send', 'install', 'prompt')
// })

// installBtn.addEventListener('click', async () => {
//   installBtn.toggleAttribute('hidden')
//   if (deferredPrompt)
//     deferredPrompt.prompt()
//   // Wait for the user to respond to the prompt
//   const { outcome } = await deferredPrompt.userChoice;
//   // Optionally, send analytics event with outcome of user choice
//   console.log(`User response to the install prompt: ${outcome}`)
//   deferredPrompt = undefined;
// });

// addEventListener('appinstalled', () => {
//   // Clear the deferredPrompt so it can be garbage collected
//   deferredPrompt = undefined
//   // Optionally, send analytics event to indicate successful install
//   console.log('PWA was installed')
// })

// Google Analytics
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag(...args: any): void
  }
}

// Event logging
if ('ga' in window) {
  // window.dataLayer = window.dataLayer || []
  // window.dataLayer.push('js', new Date)
  // window.dataLayer.push('config', 'UA-172429940-2')
  
  // @ts-ignore Event listerner types are garbage
  addEventListener('p2p-error', ({ error }: ErrorEvent) =>
    ga('send', 'event', {
      eventCategory: 'error',
      eventAction: error.message,
      eventLabel: error.stack,
      // eventValue,
      nonInteraction: true,
    }))
}

// @ts-ignore Error logging - Event listerner types are garbage
addEventListener('p2p-error', ({ error }: ErrorEvent) => console.error('P2P connection failed', error))
