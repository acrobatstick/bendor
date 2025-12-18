import "styled-components"

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      primaryText: "#0001f6"
      secondaryText: "#2d2d2d"
      primary: "#0001f6"
      warning: "#d71f1fff"
      disabled: "#cccccc"
      white: "#ffffff"
    }
    paddings: {
      container: "15px"
      pageTop: "30px"
    }
  }
}
