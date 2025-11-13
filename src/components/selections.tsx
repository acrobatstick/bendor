import { useStore } from "../hooks";
import { ActionType } from "../reducer";
import { Filter } from "../types";

function Selections() {
  const { state, dispatch } = useStore();
  const filterList = Object.keys(Filter);
  return (
    <div>
      <button onClick={() => dispatch({ type: ActionType.CreateNewLayer })}>
        Add new selection
      </button>
      <ul>
        {state.layers.map((point, idx) => (
          <li id={`${idx}`} key={idx}>
            <select
              onChange={(event) =>
                dispatch({
                  type: ActionType.UpdateLayer,
                  payload: {
                    layerIdx: idx,
                    pselection: {
                      filter: event.target.value as Filter
                    }
                  },
                })
              }
              value={point.filter}>
              {filterList.map((filter) => (
                <option key={`filter-${idx}-${filter}`}>{filter}</option>
              ))}
            </select>
            <button onClick={() => dispatch({ type: ActionType.SelectLayer, payload: idx })}>
              {state.selectedLayerIdx == idx ? "(Active)" : "Select"}
            </button>
            <button onClick={() => dispatch({ type: ActionType.DeleteLayer, payload: idx })}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Selections;
