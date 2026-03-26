// randomize filename by using the hash of the canvas blob
export const generateFilename = async (buf: ArrayBuffer) => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  const hash = hashHex.substring(0, 12)
  return hash
}

export const generateRandomHex = () => {
  return `# ${((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0")}` as `#${string}`
}

// generates random number from 1 mid point with maximum range of `diff`
export const getRandomOffset = (mid: number, diff: number): number => {
  return Math.max(Math.floor(mid + (Math.random() * 2 - 1) * diff), 0)
}
