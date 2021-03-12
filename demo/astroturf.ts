import type { List } from '@material/mwc-list'
import type { Fab } from '@material/mwc-fab'
import type litP2P from 'lit-p2p'
import type P2PSets from './p2p-sets'
import type Game from 'sets-game-engine'
import type { Peer } from '@mothepro/fancy-p2p'

import { foreverStrings } from '@mothepro/emojis'
import { MockPeer } from '@mothepro/fancy-p2p'
import { Emitter } from 'fancy-emitter'
import { Status } from './util.js'
import { milliseconds } from '../src/helper.js'

const
  names = JSON.parse(document.body.getAttribute('astroturf-names') ?? '[]'),
  backupNames = foreverStrings(),
  [minDifficulty = 0, maxDifficulty = 1] = JSON.parse(document.body.getAttribute('astroturf-difficulty-range') ?? '[]'),
  [minPlayers = 0, maxPlayers = 0] = JSON.parse(document.body.getAttribute('astroturf-player-range') ?? '[]'),
  timeScale = parseInt(document.body.getAttribute('astroturf-time-scale') ?? '0') || maxDifficulty * 1000,
  playersToAdd = Math.trunc(minPlayers + Math.random() * (maxPlayers - minPlayers + 1)),

  // Elements
  litP2pElement = document.querySelector('lit-p2p')! as litP2P,
  p2pDemoElement = document.querySelector('p2p-sets')! as P2PSets,
  defaultAstros = document.querySelectorAll('[slot="p2p-alone"].astroturf-default') as unknown as HTMLElement[],
  toggleOnlineBtns = document.querySelectorAll('[toggle-online]') as unknown as HTMLElement[],
  clientList = document.querySelector('mwc-list[slot="p2p-alone"]') as List,
  makeGroupBtn = document.querySelector('mwc-fab[slot="p2p-alone"]') as Fab

// For my best friend
if (Math.random() < 0.1)
  names.push('Max ⭐️')
else if (Math.random() > 0.9)
  names.push('🐯boy')

// stuff on change If someone leaves and joins, this will not do anything
if (document.body.hasAttribute('astroturf'))
  new MutationObserver(async () => {
    clientList.innerHTML = ''
    if (litP2pElement.getAttribute('state') == '1') {
      // Fill player list
      // TODO leave in groups too!
      for (let i = 0; i < playersToAdd; i++) {
        await milliseconds(3000 + 4000 * Math.random())
        clientList.innerHTML +=
          '<mwc-check-list-item>' +
            (names.splice(Math.trunc(Math.random() * names.length), 1)[0] ?? `Anonymous ${backupNames.next().value}`) +
          '</mwc-check-list-item>'
        
        // Hide defualts and actually show the list!
        defaultAstros.forEach(e => e.toggleAttribute('hidden', true))
        clientList.toggleAttribute('hidden', false)
        await milliseconds(7500 * Math.random())
      }
    } else { // reset after a bit, so name changes don't look jank
      await milliseconds(2000)
      if (litP2pElement.getAttribute('state') != '1') {
        defaultAstros.forEach(e => e.toggleAttribute('hidden', false))
        makeGroupBtn.setAttribute('selected', '0')
        clientList.toggleAttribute('hidden', true)
        clientList.innerHTML = ''
      }
    }
  }).observe(litP2pElement, { attributes: true, attributeFilter: ['state'] })

// @ts-ignore Ensure button count matches the selection from list
clientList.addEventListener('selected', ({ detail: { index } }: CustomEvent<{ index: Set<number> }>) =>
  makeGroupBtn.setAttribute('selected', index.size.toString()))

// Start astroturf'd game
makeGroupBtn.addEventListener('click', async () => {
  if (typeof clientList.index == 'number'
    || clientList.index.size < litP2pElement.minPeers
    || clientList.index.size > litP2pElement.maxPeers)
    return
  
  // The peers (before going offline)... should shuffle, ideally
  const peers: Peer[] = [
    new MockPeer(litP2pElement.getAttribute('name') ?? 'Me')
  ]

  for (const index of clientList.index)
    peers.push(new AstroPeer(
      clientList.children[index].textContent!.trim(),
      minDifficulty + Math.random() * (maxDifficulty - minDifficulty)))
  
  makeGroupBtn.setAttribute('selected', '0')
  // TODO wait a bit to make it feel real
  // await milliseconds(1000 + 4000 * Math.random())

  // Hide online/offline
  toggleOnlineBtns.forEach(e => e.toggleAttribute('hidden', true))

  // Go offline and wait for complete disconnection
  litP2pElement.setAttribute('state', 'astroturf')
  await new Promise<void>(resolve => new MutationObserver(() => litP2pElement.getAttribute('state') == '-1' && resolve())
    .observe(litP2pElement, { attributes: true, attributeFilter: ['state'] }))
  
  p2p = {
    peers,
    broadcast: peers[0].send,
    random: p2p.random,
  }

  dispatchEvent(new CustomEvent('p2p-astroturf'))
})

class AstroPeer implements MockPeer<ArrayBuffer> {
  // @ts-ignore Turns out mocks can be for others too!
  readonly isYou = false
  readonly ready = Promise.resolve(true)

  readonly message = new Emitter<ArrayBuffer>()
  readonly close = this.message.cancel
  readonly send = (data: ArrayBuffer | ArrayBufferView) =>
    this.message.activate(ArrayBuffer.isView(data) ? data.buffer : data)
  
  private engine!: Game

  /** The difficulty in the range [0,1) */
  readonly scaledDifficulty = (this.difficulty - minDifficulty) / (maxDifficulty - minDifficulty)

  /**
   * An exponentially smaller form of difficulty.
   * <0.5 ->> 0
   * >=0.5 -> 0
   */
  readonly squaredDifficulty = this.scaledDifficulty ** 2 //(this.difficulty / maxDifficulty) ** 2

  constructor(
    readonly name: string,
    /** Positive number to determine the skill, the lower the better */
    readonly difficulty: number) { 
    p2pDemoElement.addEventListener('game-start', this.startGame)
  }

  private startGame = async () => {
    this.engine = p2pDemoElement.engine
    
    for await (const _ of this.engine.filled)
      this.round(this.engine.filled.count)

    // Rematch!
    await milliseconds(3000 + 5000 * Math.random())
    this.send(new Uint8Array([Status.REMATCH]))
  }

  private sendVerify(round: number, ...bytes: number[]) {
    if (round == this.engine.filled.count && this.engine.filled.isAlive)
      this.send(new Uint8Array(bytes))
  }

  /** New cards are on the field... time to astroturf 😈 */
  // TODO pass in times thru generator
  private async round(round: number) {
    await milliseconds(3000) // animation

    // Dummy took a bad set!
    if (Math.random() < this.squaredDifficulty / 2) {
      await milliseconds(4000 * Math.random())
      this.sendVerify(round, 1, 2, 3) // This is the "random" set 
    }

    // Wait a bit before doing anything
    await milliseconds(
        10000 * this.difficulty
      + timeScale * Math.random())

    // Hints, increased likelyhood the higher the difficulty
    let skill = -this.scaledDifficulty + 2 / 3
    // 1st hint
    skill += Math.random()
    if (skill < 0) {      
      this.sendVerify(round, Status.HINT)
      await milliseconds(5000 // maybe use Math.max instead?
        + 10000 * this.difficulty
        + timeScale * Math.random())
    }

    // Dummy took a bad set with a possible hint!
    if (Math.random() < this.squaredDifficulty / 3) {
      this.sendVerify(round, 1, 2, 3)
      await milliseconds(1000
        + 5000 * Math.random())
    }

    // 2nd hint
    skill += Math.random()
    if (skill < 0) {      
      this.sendVerify(round, Status.HINT)
      await milliseconds(3000 // less wait
        + 10000 * this.difficulty
        + timeScale / 2 * Math.random())
    }

    // 3rd hint
    skill += Math.random()
    if (skill < 0) {      
      this.sendVerify(round, Status.HINT)
      await milliseconds(1000 // lesser wait
        + 5000 * Math.random())
    }

    // Finally take the right set
    const cards = this.engine.solution
    if (cards)
      this.sendVerify(round, ...cards.map(card => this.engine.cards.indexOf(card)))
  }
}
