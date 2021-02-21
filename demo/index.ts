import 'lit-p2p'                // <lit-p2p>
import './p2p-sets.js'          // <p2p-sets>
import '@mothepro/theme-toggle' // <theme-toggle>
import '@material/mwc-dialog'   // <mwc-dialog>
declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

function gtag(...args: any[]) {
  window.dataLayer.push(arguments)
}


// Initialize deferredPrompt for use later to show browser install prompt.
let deferredPrompt: Event | void
window.dataLayer = window.dataLayer || []

// Google Analytics
gtag('js', new Date)
gtag('config', 'UA-172429940-2')

const
  toggleOnlineBtns = document.querySelectorAll('[toggle-online]')!,
  litP2pElement = document.querySelector('lit-p2p')!,
  helpBtn = document.querySelector('mwc-icon-button[icon=help]')!,
  // installBtn = document.querySelector('mwc-icon-button[icon=download]')!,
  dialogElement = document.querySelector('mwc-dialog')!

// Make the toggle button actually do something
// @ts-ignore TODO find this hidden type exported from the module directly...
for (const toggleOnlineBtn of toggleOnlineBtns)
  toggleOnlineBtn.addEventListener('click', () => 
    litP2pElement.setAttribute('state', (litP2pElement.getAttribute('state') ?? '-1') == '-1' // is disconnected
      ? '' // try to connect
      : '-1')) // not trying to connect

// Add [open] to <mwc-dialog> after some time if first visit
if (!localStorage.length && document.body.hasAttribute('first-visit-help-delay'))
  setTimeout(
    () => dialogElement.setAttribute('open', ''),
    parseInt(document.body.getAttribute('first-visit-help-delay') ?? ''))

// Show help
helpBtn.addEventListener('click', () => dialogElement.toggleAttribute('open'))
addEventListener('keypress', ({ key }: KeyboardEvent) => key == '?' && dialogElement.toggleAttribute('open'))

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

// Error logging
// @ts-ignore Event listerner types are garbage
document.body.firstElementChild!.addEventListener('p2p-error', (error: ErrorEvent) => {
  console.error('Lost connection', error)
  ga('send', 'exception', {
    exDescription: `${error.message} -- ${(error as unknown as Error).stack}`,
    exFatal: false, // idk...
  })
})
