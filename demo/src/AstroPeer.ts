import Game from 'sets-game-engine'
import { MockPeer } from '@mothepro/fancy-p2p'
import { Emitter } from 'fancy-emitter'
import { Status, random } from './util.js'
import { milliseconds } from '../../src/helper.js'
import { ANIMATION_DURATION } from '../../src/card.js'
import { p2pDemoElement, failureDelay1, roundDelay, hintDelay1, failureDelay2, hintDelay2, hintDelay3 } from './astroturf'


export default class implements MockPeer<ArrayBuffer> {
  // @ts-ignore Turns out mocks can be for others too!
  readonly isYou = false;
  readonly ready = Promise.resolve(true);

  readonly message = new Emitter<ArrayBuffer>();
  readonly close = this.message.cancel;
  readonly send = (data: ArrayBuffer | ArrayBufferView) => this.message.activate(ArrayBuffer.isView(data) ? data.buffer : data);

  private engine!: Game

  constructor(
    readonly name: string,
    /** [0,1] probability to take a bad set. */
    readonly failureRate: number,
    /** [0,1] probability to take a hint. */
    readonly hintRate: number,
    /** Positive factor to adjust delay timing calculations. */
    readonly delayScale = 1
  ) {
    p2pDemoElement.addEventListener('game-start', async () => {
      this.engine = p2pDemoElement.engine

      for await (const _ of this.engine.filled)
        this.round(this.engine.filled.count)

      // Rematch!
      dispatchEvent(new CustomEvent('game-finish-astroturf'))
      await milliseconds(random(3000, 8000))
      this.send(new Uint8Array([Status.REMATCH]))
    })
  }

  private sendVerify(round: number, ...bytes: number[]) {
    if (round == this.engine.filled.count && this.engine.filled.isAlive)
      this.send(new Uint8Array(bytes))
  }

  /** New cards are on the field... time to astroturf 😈 */
  // TODO pass in times thru generator
  private async round(round: number) {
    await milliseconds(this.engine.cards.length * ANIMATION_DURATION)

    // Dummy took a bad set! (this is early to kinda rush the player)
    if (Math.random() < this.failureRate) {
      await milliseconds(this.delayScale * random(failureDelay1))
      this.sendVerify(round, 1, 2, 3) // This is the "random" set 
    }

    // "Thinking..." Wait a bit before doing anything
    await milliseconds(this.delayScale * random(roundDelay))

    // Hints, increased likelyhood the higher the difficulty
    let skill = -this.hintRate
    // 1st hint
    skill += Math.random()
    if (skill < 0) {
      this.sendVerify(round, Status.HINT)
      await milliseconds(this.delayScale * random(hintDelay1))
    }

    // Dummy took a bad set, even with a possible hint!
    if (Math.random() < this.failureRate * 2 / 3) {
      this.sendVerify(round, 1, 2, 3)
      await milliseconds(this.delayScale * random(failureDelay2))
    }

    // 2nd hint
    skill += Math.random()
    if (skill < 0) {
      this.sendVerify(round, Status.HINT)
      await milliseconds(this.delayScale * random(hintDelay2))
    }

    // 3rd hint
    skill += Math.random()
    if (skill < 0) {
      this.sendVerify(round, Status.HINT)
      await milliseconds(this.delayScale * random(hintDelay3))
    }

    // Finally take the right set
    const cards = this.engine.solution
    if (cards)
      this.sendVerify(round, ...cards.map(card => this.engine.cards.indexOf(card)))
  }
}
