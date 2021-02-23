import 'lit-p2p'                // <lit-p2p>
import '@mothepro/theme-toggle' // <theme-toggle>
import '@material/mwc-dialog'   // <mwc-dialog>
import './p2p-sets.js'          // <p2p-sets>

// Elements in index.html
const
  litP2pElement = document.querySelector('lit-p2p')!,
  setsElement = document.querySelector('p2p-sets')!,
  toggleOnlineBtns = document.querySelectorAll('[toggle-online]')!,
  helpDialogElement = document.getElementById('help')!,
  // installBtn = document.querySelector('mwc-icon-button[icon=download]')!,
  dialogOpenerElements = document.querySelectorAll('[open-dialog]')!


// Dialog openers
dialogOpenerElements.forEach(opener => 
  opener.addEventListener('click', () => document
    .getElementById(opener.getAttribute('open-dialog') ?? '')
    ?.toggleAttribute('open')))

// Make the toggle button actually do something
toggleOnlineBtns.forEach(toggleOnlineBtn =>
  toggleOnlineBtn.addEventListener('click', () => 
    litP2pElement.setAttribute('state', (litP2pElement.getAttribute('state') ?? '-1') == '-1' // is disconnected
      ? '' // try to connect
      : '-1'))) // not trying to connect

// Add [open] to <mwc-dialog> after some time if first visit
if (!localStorage.length && document.body.hasAttribute('first-visit-help-delay'))
  setTimeout(
    () => helpDialogElement.setAttribute('open', ''),
    parseInt(document.body.getAttribute('first-visit-help-delay') ?? ''))

// Global keybinds
addEventListener('keypress', ({ key }: KeyboardEvent) => {
  switch (key) {
    case '?': // Show help
      helpDialogElement.toggleAttribute('open')
      break
      
    case 'c': // Show clock
      setsElement.toggleAttribute('show-clock')
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

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

// Event logging
if ('ga' in window) {
  // Google Analytics
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push('js', new Date)
  window.dataLayer.push('config', 'UA-172429940-2')
  
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
