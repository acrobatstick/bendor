// a hack to make it runs properly with the process() worker.
// use it when it's critical to wait for changes on state before
// running the canvas processing
let processingPromise: Promise<void> | null = null
let resolveProcessing: (() => void) | null = null

export function waitForProcessing() {
  if (!processingPromise) {
    processingPromise = new Promise<void>((resolve) => {
      resolveProcessing = resolve
    })
  }
  return processingPromise
}

export function markProcessingDone() {
  resolveProcessing?.()
  resolveProcessing = null
  processingPromise = null
}
