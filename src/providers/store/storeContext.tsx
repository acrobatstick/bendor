import { createContext, type Dispatch } from "react"
import type { State } from "~/types"
import type { Action } from "./reducer"

type StoreContextValue = {
  state: State
  dispatch: Dispatch<Action>
  stateRef: React.MutableRefObject<State>
}

export const StoreContext = createContext<StoreContextValue | undefined>(undefined)
