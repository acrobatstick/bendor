import { useReducer, type ReactNode } from "react";
import reducer from "./reducer";
import { initialStoreState } from "./storeState";
import { StoreContext } from "./storeContext";

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialStoreState);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};
