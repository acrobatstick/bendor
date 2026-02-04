import { type ReactNode, useEffect, useReducer, useRef } from "react"
import type { State } from "~/types"
import reducer from "./reducer"
import { StoreContext } from "./storeContext"
import { initialStoreState } from "./storeState"

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialStoreState)
  const stateRef = useRef<State>(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch, stateRef }}>{children}</StoreContext.Provider>
}
