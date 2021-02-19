import 'lit-p2p'                // <lit-p2p>
import './p2p-sets.js'          // <p2p-sets>
import '@mothepro/theme-toggle' // <theme-toggle>
import '@material/mwc-dialog'   // <mwc-dialog>

const
  toggleOnlineBtns = document.querySelectorAll('[toggle-online]')!,
  litP2pElement = document.querySelector('lit-p2p')!,
  helpBtn = document.querySelector('mwc-icon-button[icon=help]')!,
  dialogElement = document.querySelector('mwc-dialog')!

// Make the toggle button actually do something
// @ts-ignore TODO find this hidden type exported from the module directly...
for (const toggleOnlineBtn of toggleOnlineBtns)
  toggleOnlineBtn.addEventListener('click', () => 
    litP2pElement.setAttribute('state', (litP2pElement.getAttribute('state') ?? '-1') == '-1' // is disconnected
      ? '' // try to connect
      : '-1')) // not trying to connect

// Add [open] to <mwc-dialog> after some time if first visit
if (!localStorage.length)
  setTimeout(
    () => dialogElement.setAttribute('open', ''),
    parseInt(document.body.getAttribute('first-visit-help-delay') ?? ''))

// Show help
helpBtn.addEventListener('click', () => dialogElement.toggleAttribute('open'))
addEventListener('keypress', ({ key }: KeyboardEvent) => key == '?' && dialogElement.toggleAttribute('open'))
