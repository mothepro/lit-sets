import type { Dialog } from '@material/mwc-dialog'
import type { IconButton } from '@material/mwc-icon-button'
import type { ThemeEvent } from '@mothepro/theme-toggle'
import type LitP2P from 'lit-p2p'
import type P2PSets from './p2p-sets.js'
import { log, BeforeInstallPromptEvent, dimension } from './util.js'

import 'lit-p2p'                // <lit-p2p>
import '@mothepro/theme-toggle' // <theme-toggle>
import '@material/mwc-dialog'   // <mwc-dialog>
import './p2p-sets.js'          // <p2p-sets>

const // Elements in index.html
  litP2pElement = document.querySelector('lit-p2p')! as LitP2P,
  p2pDemoElement = document.querySelector('p2p-sets')! as P2PSets,
  toggleOnlineBtns = document.querySelectorAll('[toggle-online]')! as unknown as IconButton[],
  toggleHiddenBtns = document.querySelectorAll('[toggle-hidden]')! as unknown as IconButton[],
  helpDialogElement = document.getElementById('help')! as Dialog,
  installBtn = document.querySelector('mwc-icon-button[icon=download]')!,
  dialogOpenerElements = document.querySelectorAll('[open-dialog]')! as unknown as IconButton[]

// Service worker to make this a PWA
if (location.protocol == 'https:')
  navigator?.serviceWorker.register('sw.js')

// first-visit attribute
if (localStorage.length)
  document.body.removeAttribute('first-visit')

// Remove easy mode
if (!document.body.hasAttribute('first-visit') && document.body.getAttribute('not-first-visit-mode') == 'hard')
  p2pDemoElement.removeAttribute('easy-mode')

// Auto connect
if (location.hash.includes('multiplayer'))
  litP2pElement.toggleAttribute('state', true)

// Hide some elements in offline mode
if (!navigator.onLine)
  document
    .querySelectorAll('[hide-offline]')
    .forEach(elem => elem.toggleAttribute('hidden', true))

// Dialog openers
for (const opener of dialogOpenerElements)
  opener.addEventListener('click', () => document
    .getElementById(opener.getAttribute('open-dialog') ?? '')
    ?.toggleAttribute('open'))

// Make the toggle hidden buttons actually do something
for (const toggleHiddenBtn of toggleHiddenBtns)
  toggleHiddenBtn.addEventListener('click', () => 
    document.getElementById(toggleHiddenBtn.getAttribute('toggle-hidden')!)?.toggleAttribute('hidden'))

// Make the toggle button actually do something
for (const toggleOnlineBtn of toggleOnlineBtns)
  toggleOnlineBtn.addEventListener('click', () => 
    litP2pElement.setAttribute('state', (litP2pElement.getAttribute('state') ?? '-1') == '-1' // is disconnected
      ? '' // try to connect
      : '-1')) // not trying to connect

// Add [open] to <mwc-dialog> after some time if first visit
if (document.body.hasAttribute('first-visit') && document.body.hasAttribute('first-visit-help-delay'))
  setTimeout(
    () => helpDialogElement.toggleAttribute('open', true),
    parseInt(document.body.getAttribute('first-visit-help-delay') ?? ''))

// Difficulty Change switches online lobbies
// const lobbyPrefix = litP2pElement.getAttribute('lobby') ?? '',
//   standardDifficultySuffix = '-standard-'
// p2pDemoElement.addEventListener('difficulty', () => 
//   litP2pElement.setAttribute('lobby', p2pDemoElement.hasAttribute('easy-mode')
//     ? lobbyPrefix
//     : lobbyPrefix + standardDifficultySuffix))

// Key shortcuts
addEventListener('keypress', (event: KeyboardEvent) => {
  // Get these at runtime since it may not always exist or be visible
  const gameVisible = !!((p2pDemoElement.shadowRoot?.querySelector('lit-sets') as HTMLElement)?.offsetParent),
    // TODO add `:not([disabled])` to selector so events arent preformed on disabled buttons
    // Must support if ban timers are enabled
    hintBtn = p2pDemoElement.shadowRoot?.querySelector('[part~="hint"]') as IconButton | null,
    rearrangeBtn = p2pDemoElement.shadowRoot?.querySelector('[part~="rearrange"]') as IconButton | null,
    takeBtn = p2pDemoElement.shadowRoot?.querySelector('[part~="take"]') as IconButton | null
  switch (event.key) {
    case '?': // Show help
      helpDialogElement.toggleAttribute('open')
      break
      
    case 'c': // Show clock
      p2pDemoElement.toggleAttribute('show-clock')
      break
    
    case 'Enter': // Take set
      if (gameVisible) {
        event.preventDefault() // Don't select card that is currently focused
        takeBtn?.click()
      }
      break
    
    case 'h': // Take Hint
      if (gameVisible)
        hintBtn?.click()
      break
    
    case 'r': // Rearrange
      if (gameVisible)
        rearrangeBtn?.click()
      break
  }
})

  /////////////
 // Logging //\
///////////// \\
// PWA
// when will `navigator.standalone` be supported
dimension(1, matchMedia('(display-mode: standalone)')?.matches  ? 'standalone' : 'browser')

let deferredPrompt: BeforeInstallPromptEvent | void // for use later to show browser install prompt.
addEventListener('appinstalled', () => deferredPrompt = log('install', 'complete'))
addEventListener('beforeinstallprompt', event => {
  deferredPrompt = event as BeforeInstallPromptEvent
  installBtn.removeAttribute('hidden')
  log('install', 'prompt')
})
installBtn.addEventListener('click', async () => {
  installBtn.toggleAttribute('hidden', true)
  if (deferredPrompt) {
    deferredPrompt.prompt()
    deferredPrompt = log('install', JSON.stringify(await deferredPrompt.userChoice))
  }
})

let times = 0
//@ts-ignore General Events
document.querySelector('theme-toggle')
  ?.addEventListener('theme-change', ({ detail }: ThemeEvent) =>
    log(`theme-${times ? 'change' : 'start'}`, detail, times ? `Times clicked: ${times++}` : undefined))

document.querySelectorAll('mwc-dialog').forEach(dialog =>
  dialog.addEventListener('opened', () => log('dialog', 'opened', dialog.id)))

// @ts-ignore P2P Events
addEventListener('p2p-error', ({ error }: ErrorEvent) =>
  log('error', `me: "${p2pDemoElement.getAttribute('name')}" causer: "${error?.peer}" message: ${error.message} `, error.stack))

const skip = { // TODO this is horrible!! I just don't wanna log the 1st time loading events
  update: false,
  name: false,
  state: false,
}
addEventListener('p2p-update', () => skip.update ? log('p2p', 'update', `group with ${p2p.peers.length}`) : skip.update = true)
new MutationObserver(records => {
  for (const record of records)
    if (skip[record.attributeName as 'state' | 'name'])
      log('p2p', record.attributeName!, litP2pElement.getAttribute(record.attributeName!) ?? '')
      // `${record.oldValue} -> ${litP2pElement.getAttribute(record.attributeName!)}`
    else
      skip[record.attributeName as 'state' | 'name'] = true
}).observe(litP2pElement, {
  attributes: true,
  attributeFilter: ['state', 'name']
})

// Game Events
p2pDemoElement.addEventListener('game-restart', () => log('game', 'restart', p2p.peers.length.toString() + ' players'))
p2pDemoElement.addEventListener('game-start', () => log('game', 'start', p2pDemoElement.hasAttribute('easy-mode') ? 'easy' : 'standard'))
p2pDemoElement.addEventListener('game-difficulty', () => log('game', 'difficulty', p2pDemoElement.hasAttribute('easy-mode') ? 'easy' : 'standard'))
p2pDemoElement.addEventListener('game-hint', ({ detail }) => log('game', 'hint', detail.toString()))
p2pDemoElement.addEventListener('game-rearrange', () => log('game', 'rearrange'))
p2pDemoElement.addEventListener('game-take', ({ detail }) => log('game', 'take', detail.toString()))
p2pDemoElement.addEventListener('game-finish', ({ detail }) => log('game', 'finish', `${p2pDemoElement.winnerText}
  ${detail} seconds, ${p2pDemoElement.hasAttribute('easy-mode') ? 'easy' : 'standard'} difficulty`))
// p2pDemoElement.addEventListener('game-selected', () => log('game', 'selected')) // Do I even care about this
new MutationObserver(records => {
  for (const record of records)
    log('game', record.attributeName!)
}).observe(p2pDemoElement, {
  attributes: true,
  attributeFilter: ['show-clock']
})
