import { LitElement, customElement, property, css, html } from 'lit-element'

/** Convert a Color and opacity into */
function cssColor(color: Details.Color, opacity = Details.Opacity.SOLID) {
  switch (color) {
    case Details.Color.BLUE:
      return css`hsla(207, 90%, 58%, ${1 - opacity / 2})`
    case Details.Color.RED:
      return css`hsla(45, 100%, 50%, ${1 - opacity / 2})`
    case Details.Color.GREEN:
      return css`hsla(4, 90%, 58%, ${1 - opacity / 2})`
  }
}

const
  /** Equilateral Triangle Ratio. Thanks Amima :) */
  baseByHeight = Math.sqrt(3) / 3,
  /** Border width ratio */
  borderSize = 1 / 6,
  /** All possible colors */
  colors = [Details.Color.RED, Details.Color.GREEN, Details.Color.BLUE],
  /** All possible opacities */
  opacities = [Details.Opacity.EMPTY, Details.Opacity.HALF, Details.Opacity.SOLID]

const y = borderSize * baseByHeight,
  x = Math.sqrt(borderSize ** 2 - y ** 2),
  b = baseByHeight - x

/**
 * A visiual representation for a shape in sets.
 * The size of the shape can be controlled by the `font-size` property.
 */
@customElement('sets-shape')
export default class extends LitElement {

  @property({ type: Number })
  opacity!: Details.Opacity

  @property({ type: Number })
  color!: Details.Color

  @property({ type: Number })
  shape!: Details.Shape

  static readonly styles = [css`
  :host {
    display: inline-block;
    border-style: solid;
    border-color: transparent;
    width: ${1 - 2 * borderSize}em;
    height: ${1 - 2 * borderSize}em;
    border-width: ${borderSize}em;
  }
  :host([shape="${Details.Shape.SQUARE}"]) {
    border-radius: 0.1em;
  }
  :host([shape="${Details.Shape.CIRCLE}"]) {
    border-radius: 50%;
  }
  :host([shape="${Details.Shape.TRIANGLE}"]) {
    position: relative;
    width: 0;
    height: 0;
    border-width: 0 ${baseByHeight}em 1em;
  }
  :host([shape="${Details.Shape.TRIANGLE}"]) span {
    position: absolute;

    top: ${borderSize}em;
    left: ${-b}em;
    border-width: 0
      ${b}em
      ${1 - borderSize - y}em;

    border-style: solid;
    border-color: transparent;
    border-bottom-color: var(--mdc-theme-primary, white);
  }`,

  // Shape border
  ...colors.map(color => css`
    :host([shape="${Details.Shape.SQUARE}"][color="${color}"]),
    :host([shape="${Details.Shape.CIRCLE}"][color="${color}"]) {
      border-color: ${cssColor(color)};
    }
    :host([shape="${Details.Shape.TRIANGLE}"][color="${color}"]) {
      border-bottom-color: ${cssColor(color)};
    }`),

  // Inner triangle
  ...opacities.map(opacity => css`
    :host([opacity="${opacity}"]) span {
      opacity: ${1 - opacity / 2};
    }`),

  // Inner square and circle
  ...colors.flatMap(color => opacities.map(opacity => css`
    :host([shape="${Details.Shape.SQUARE}"][color="${color}"][opacity="${opacity}"]),
    :host([shape="${Details.Shape.CIRCLE}"][color="${color}"][opacity="${opacity}"]) {
        background-color: ${cssColor(color, opacity)};
    }`))]

  protected readonly render = () =>
    this.shape == Details.Shape.TRIANGLE
      ? html`<span></span>`
      : null
}
