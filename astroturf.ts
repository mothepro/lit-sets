import type { List } from '@material/mwc-list'
import type { Fab } from '@material/mwc-fab'
import type litP2P from 'lit-p2p'
import type P2PSets from './p2p-sets'
import type Game from 'sets-game-engine'

import { foreverStrings } from '@mothepro/emojis'
import { MockPeer } from '@mothepro/fancy-p2p'
import { Emitter } from 'fancy-emitter'
import { Status } from './util.js'
import { milliseconds } from '../src/helper.js'

const
  names = JSON.parse(document.body.getAttribute('astroturf-names') ?? '[]'),
  backupNames = foreverStrings(),
  [minPlayers = 0, maxPlayers = 0] = JSON.parse(document.body.getAttribute('astroturf-player-range') ?? '[]'),
  [minDifficulty = 0, maxDifficulty = 1] = JSON.parse(document.body.getAttribute('astroturf-difficulty-range') ?? '[]'),

  // Elements
  litP2pElement = document.querySelector('lit-p2p')! as litP2P,
  p2pDemoElement = document.querySelector('p2p-sets')! as P2PSets,
  defaultAstros = document.querySelectorAll('[slot="p2p-alone"].astroturf-default') as unknown as HTMLElement[],
  clientList = document.querySelector('mwc-list[slot="p2p-alone"]') as List,
  makeGroupBtn = document.querySelector('mwc-fab[slot="p2p-alone"]') as Fab

// For my best friend
if (Math.random() < 0.1)
  names.push('Max ⭐️')
else if (Math.random() > 0.9)
  names.push('🐯boy')

// stuff on change
if (document.body.hasAttribute('astroturf'))
  new MutationObserver(async () => {
    if (litP2pElement.getAttribute('state') == '1') {
      // Fill player list
      for (let i = 0; i < minPlayers + (1 + maxPlayers - minPlayers) * Math.random(); i++) {
        await milliseconds(3000 + 7000 * Math.random())
        clientList.innerHTML +=
          '<mwc-check-list-item>' +
            (names.splice(Math.trunc(Math.random() * names.length), 1)[0] ?? `Anonymous ${backupNames.next().value}`) +
          '</mwc-check-list-item>'
        
        // Hide defualts and actually show the list!
        defaultAstros.forEach(e => e.toggleAttribute('hidden', true))
        clientList.toggleAttribute('hidden', false)
        await milliseconds(17500 * Math.random())
      }
    } else { // reset
      defaultAstros.forEach(e => e.toggleAttribute('hidden', false))
      makeGroupBtn.setAttribute('selected', '0')
      clientList.toggleAttribute('hidden', true)
      clientList.innerHTML = ''
    }
  }).observe(litP2pElement, { attributes: true, attributeFilter: ['state'] })

// @ts-ignore Ensure button count matches the selection from list
clientList.addEventListener('selected', ({ detail: { index } }: CustomEvent<{ index: Set<number> }>) =>
  makeGroupBtn.setAttribute('selected', index.size.toString()))

// Start astroturf'd game
makeGroupBtn.addEventListener('click', () => {
  if (typeof clientList.index == 'number' || clientList.index.size == 0)
    return
  
  // We should assume they are in single player!
  // Close current connections
  for (const peer of p2p.peers)
    peer.close()
  
  const myPeer = new MockPeer(litP2pElement.getAttribute('name') ?? 'Me')
    
  // @ts-ignore
  p2p.broadcast = myPeer.send
  p2p.peers.length = 0 // Clear peers
  p2p.peers.push(myPeer) // ReAdd me to rebind emitters
  for (const index of clientList.index) // Add astros!
    p2p.peers.push(new AstroPeer(
      clientList.children[index].textContent!.trim(),
      minDifficulty + Math.random() * (maxDifficulty - minDifficulty)))
  
  // TODO wait a bit to make it feel real
  // await milliseconds(1000 + 4000 * Math.random())

  litP2pElement.setAttribute('state', '-1')
  // May be break if p2p.peers.length is already >=2
  dispatchEvent(new CustomEvent('p2p-update', { detail: 'astroturf' }))
})

class AstroPeer implements MockPeer<ArrayBuffer> {
  // @ts-ignore Turns out mocks can be for others too!
  readonly isYou = false
  readonly ready = Promise.resolve(true)

  readonly message = new Emitter<ArrayBuffer>()
  readonly close = this.message.cancel
  readonly send = (data: ArrayBuffer | ArrayBufferView) =>
    this.message.activate(ArrayBuffer.isView(data) ? data.buffer : data)
  
  private currentRound = 0
  private engine!: Game

  constructor(
    readonly name: string,
    /** Positive number to determine the skill, the lower the better */
    readonly difficulty = Math.random()) { 
    p2pDemoElement.addEventListener('game-start', this.startGame)
  }

  private startGame = async () => {
    this.engine = p2pDemoElement.engine
    
    for await (const _ of this.engine.filled)
      this.round(++this.currentRound)

    // Rematch!
    await milliseconds(3000 + 5000 * Math.random())
    this.send(new Uint8Array([Status.REMATCH]))
  }

  /** New cards are on the field... time to astroturf 😈 */
  // TODO pass in times thru generator
  private async round(round: number) {
    // Wait a bit before doing anything
    await milliseconds(
      4000 // animation
      + 20000 * this.difficulty
      + 10000 * Math.random())

    // Dummy took a bad set!
    if (Math.random() < (this.difficulty / maxDifficulty) ** 2) {
      if (round != this.currentRound || !this.engine.filled.isAlive)
        return
      this.send(new Uint8Array([1, 2, 3])) // This is the "random" set LOL
      await milliseconds(4000
        + 30000 * this.difficulty
        + 60000 * Math.random())
    }

    // Hints, increased likelyhood the higher the difficulty
    let skill = -this.difficulty
    skill += Math.random() * maxDifficulty - minDifficulty
    if (skill < 0) { // 1st hint
      if (round != this.currentRound || !this.engine.filled.isAlive)
        return
      
      this.send(new Uint8Array([Status.HINT]))
      await milliseconds(5000 
        + 30000 * this.difficulty
        + 60000 * Math.random())
    }

    skill += Math.random() * maxDifficulty - minDifficulty
    if (skill < 0) { // 2nd hint
      if (round != this.currentRound || !this.engine.filled.isAlive)
        return
      
      this.send(new Uint8Array([Status.HINT]))
      await milliseconds(3000 // less wait
        + 10000 * this.difficulty
        + 5000 * Math.random())
    }

    // Finally take the right set
    const cards = this.engine.solution
    if (round != this.currentRound || !this.engine.filled.isAlive || !cards)
      return
    
    this.send(new Uint8Array(cards.map(card => this.engine.cards.indexOf(card))))
  }
}
