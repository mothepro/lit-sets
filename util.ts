

// git update-index --no-skip-worktree demo/util.ts
import { html } from 'lit-element'
import { Card, Details } from 'sets-game-engine'

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<'accepted' | 'dismissed'>
  platforms: string[]
}

/** A user cause "interactive", event to save */
// TODO add better support for interactive vs non-interactive
export function log(category: string, action: string, label?: string, value?: number, interaction = true) {
  if ('ga' in window) // ga?.(...) should work!?
    ga.getAll()[0]?.send('event', {
      eventCategory: category,
      eventAction: action,
      eventLabel: label,
      eventValue: value,
      nonInteraction: !interaction,
    })
  // else // Allow logging in prod for now
    console.log(new Date, arguments)
}

/** Generator that returns linear values given `y = mx + b` */
export function* linear(m: number, b: number): Generator<number, never, unknown> {
  yield b
  while (true)
    yield b += m
}

/** Returns the `html` of the card which would be needed to complete the given set. */
export function getNeededCard(
  { shape: shapeA, quantity: quantityA, color: colorA }: Card,
  { shape: shapeB, quantity: quantityB, color: colorB }: Card) {
  // Assume these will just be all the same as first card
  let shape = shapeA,
    quantity = quantityA,
    color = colorA

  // The shapes are actually different
  if (shapeA != shapeB) {
    const details = new Set([Details.Shape.CIRCLE, Details.Shape.SQUARE, Details.Shape.TRIANGLE])
    details.delete(shapeA)
    details.delete(shapeB)
    shape = [...details][0]
  }

  // The quantities are actually different
  if (quantityA != quantityB) {
    const details = new Set([Details.Quantity.ONE, Details.Quantity.TWO, Details.Quantity.THREE])
    details.delete(quantityA)
    details.delete(quantityB)
    quantity = [...details][0]
  }

  // The colors are actually different
  if (colorA != colorB) {
  const details = new Set([Details.Color.BLUE, Details.Color.GREEN, Details.Color.RED])
    details.delete(colorA)
    details.delete(colorB)
    color = [...details][0]
  }

  return html`
    <sets-card
      part="solution-card"
      opacity="0"
      shape=${shape}
      quantity=${quantity}
      color=${color}
    ></sets-card>`
}
