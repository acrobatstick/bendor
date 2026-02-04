import { useEffect, useRef } from "react"
import type { State } from "~/types"
import ProcessWorker from './processCanvas.worker.ts?worker'

const useProcessCanvas = () => {
  const ref = useRef<Worker | null>(null)
  useEffect(() => {
    ref.current = new ProcessWorker()
    return () => {
      ref.current?.terminate()
    }
  }, [])

  const run = async (state: State): Promise<undefined> => {
    return new Promise((resolve, reject) => {
      if (!state.imgCtx || !ref.current) {
        reject("could not process canvas")
        return
      }

      const handleMsg = (e: MessageEvent) => {
        ref.current?.removeEventListener('message', handleMsg)

        if (e.data.error) {
          reject(new Error(e.data.error))
          return
        }

        console.log(e.data)
        resolve(e.data)
      }

      ref.current.addEventListener('message', handleMsg)
      ref.current.postMessage("message")
    })
  }

  return run
}

export default useProcessCanvas
