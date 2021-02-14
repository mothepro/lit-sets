import './p2p-sets.js'
import '@mothepro/theme-toggle'
  
const
  toggleOnlineBtns = document.querySelectorAll('[toggle-online-btn]')!,
  litP2pElement = document.getElementById('p2p')!,
  themeToggleKey = 'theme' // Since we use `<theme-toggle`>
  
/** Sets the <lit-p2p> state to the given value. Defaults to the opposite one. */
// @ts-ignore TODO find this hidden type exported from the module directly...
for (const toggleOnlineBtn of toggleOnlineBtns)
  toggleOnlineBtn.addEventListener('click', () => 
    litP2pElement.setAttribute('state', (litP2pElement.getAttribute('state') ?? '-1') == '-1' // is disconnected
      ? '' // try to connect
      : '-1')) // not trying to connect

// Check for 1st time visit
if (localStorage.getItem(themeToggleKey))
  document.body.removeAttribute('first-visit')
