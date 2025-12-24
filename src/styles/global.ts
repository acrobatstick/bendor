import styled, { createGlobalStyle } from "styled-components"

export const GlobalStyles = createGlobalStyle`
  @font-face {
    font-family: "Modeseven"; 
    src: local("Modeseven"), url("./fonts/Modeseven.ttf") format("truetype");
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
    font-family: "Modeseven"; 
    src: local("Modeseven"), url("./fonts/Modeseven.ttf") format("truetype");
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -o-user-select: none;
    user-select: none;
  }
  
  /* html reset */
  html,
  body,
  div,
  span,
  applet,
  object,
  iframe,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  blockquote,
  pre,
  a,
  abbr,
  acronym,
  address,
  big,
  cite,
  code,
  del,
  dfn,
  em,
  img,
  ins,
  kbd,
  q,
  s,
  samp,
  small,
  strike,
  strong,
  sub,
  sup,
  tt,
  var,
  b,
  u,
  i,
  center,
  dl,
  dt,
  dd,
  ol,
  ul,
  li,
  fieldset,
  form,
  label,
  legend,
  table,
  caption,
  tbody,
  tfoot,
  thead,
  tr,
  th,
  td,
  article,
  aside,
  canvas,
  details,
  embed,
  figure,
  figcaption,
  footer,
  header,
  hgroup,
  menu,
  nav,
  output,
  ruby,
  section,
  summary,
  time,
  mark,
  audio,
  video {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    vertical-align: baseline;
  }
  
  /* HTML5 display-role reset for older browsers */
  article,
  aside,
  details,
  figcaption,
  figure,
  footer,
  header,
  hgroup,
  menu,
  nav,
  section {
    display: block;
  }
  
  body {
    line-height: 1;
    background-repeat: repeat;
    background-image: url("./grid_patterns.png");
  }
  
  ol,
  ul {
    list-style: none;
  }
  
  blockquote,
  q {
    quotes: none;
  }
  
  blockquote:before,
  blockquote:after,
  q:before,
  q:after {
    content: "";
    content: none;
  }
  
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  button {
    all: unset;
  }

  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }

  select::-ms-expand {
    display: none;
  }

  .react-colorful__saturation {
    border-radius: 0px !important;
  }

  .react-colorful__hue {
    border-radius: 0px !important;
  }

  .react-colorful__last-control {
    border-radius: 0px !important;
  }

  .onboarding {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    border-radius: 0px;
  }

  .shepherd-modal-overlay-container {
    opacity: 0.6 !important;
  }

  .shepherd-title {
    color: ${({ theme }) => theme.colors.primary};
  }

  .shepherd-element .shepherd-arrow:after {
    content: url('./images/arrow.svg');
    color: #0062f6ff;
    display: inline-block;
  }

  .shepherd-element .shepherd-arrow {
    border-width: 0;
    height: auto;
    width: auto;
  }

  .shepherd-arrow::before {
    display: none;
  }

  .shepherd-element[data-popper-placement^='top'] .shepherd-arrow,
  .shepherd-element.shepherd-pinned-top .shepherd-arrow {
    bottom: -35px;
  }

  .shepherd-element[data-popper-placement^='top'] .shepherd-arrow:after,
  .shepherd-element.shepherd-pinned-top .shepherd-arrow:after {
    transform: rotate(270deg);
  }

  .shepherd-element[data-popper-placement^='bottom'] .shepherd-arrow {
    top: -35px;
  }

  .shepherd-element[data-popper-placement^='bottom'] .shepherd-arrow:after {
    transform: rotate(90deg);
  }

  .shepherd-element[data-popper-placement^='left'] .shepherd-arrow,
  .shepherd-element.shepherd-pinned-left .shepherd-arrow {
    right: -35px;
  }

  .shepherd-element[data-popper-placement^='left'] .shepherd-arrow:after,
  .shepherd-element.shepherd-pinned-left .shepherd-arrow:after {
    transform: rotate(180deg);
  }

  .shepherd-element[data-popper-placement^='right'] .shepherd-arrow,
  .shepherd-element.shepherd-pinned-right .shepherd-arrow {
    left: -35px;
  }

  .shepherd-button {
    background: #ffffff;
    border-radius: 0;
    color: ${({ theme }) => theme.colors.primary};
    display: flex;
    flex-grow: 1;
    font-size: 1rem;
    justify-content: center;
    margin: 0;
    padding: 0.2;
    text-align: center;
    text-transform: uppercase;
  }

  .shepherd-button:hover {
    color: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
  }

  .shepherd-button.shepherd-button-secondary {
    background: #cad5d5;
  }

  .shepherd-button.shepherd-button-secondary:hover {
    color: #cad5d5;
    color: ${({ theme }) => theme.colors.primary};
  }
`

export const PushTop = styled.div`
  margin-top: auto;
`

export const FlexEnd = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
`

export const FlexGap = styled.div<{ direction: "col" | "row" }>`
  display: flex;
  flex-direction: ${({ direction }) => (direction === "col" ? "column" : "row")};
  gap: 8px;
`
