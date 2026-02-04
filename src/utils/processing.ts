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
