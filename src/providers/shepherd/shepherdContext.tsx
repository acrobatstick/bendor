import type Shepherd from "node_modules/shepherd.js/dist/cjs/shepherd.d.cts"
import { createContext } from "react"

export const ShepherdTourContext = createContext<Shepherd.Tour | null>(null)
