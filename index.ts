import './p2p-sets.js'
import '@mothepro/theme-toggle'
import '@material/mwc-dialog'
  
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

// Check for 1st time visit
if (localStorage.getItem(document.body.getAttribute('toggle-theme-key') ?? 'theme'))
  document.body.removeAttribute('first-visit')
else // add [open] to <mwc-dialog> after some time
  setTimeout(
    () => dialogElement.setAttribute('open', ''),
    parseInt(document.body.getAttribute('first-visit-help-delay') ?? ''))

// Show help
helpBtn.addEventListener('click', () => dialogElement.setAttribute('open', ''))
addEventListener('keypress', ({ key }: KeyboardEvent) => key == '?' && dialogElement.setAttribute('open', ''))
