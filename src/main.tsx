import { createRoot } from "react-dom/client"
import "shepherd.js/dist/css/shepherd.css"
import { ThemeProvider } from "styled-components"
import App from "./App.tsx"
import { ShepherdProvider } from "./providers/shepherd/shepherdProvider.tsx"
import { StoreProvider } from "./providers/store/storeProvider.tsx"
import { GlobalStyles } from "./styles/global.ts"
import { theme } from "./styles/theme.ts"

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <GlobalStyles />
    <ShepherdProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ShepherdProvider>
  </ThemeProvider>
)
