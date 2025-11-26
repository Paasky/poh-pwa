export function getRandom<T> (arr: readonly T[]): T {
  if (arr.length < 1) throw new Error(`Not enough items in array: ${arr.length}`)
  const copy = [...arr]
  return takeRandom(copy)
}

export function getManyRandom<T> (arr: readonly T[], count: number): T[] {
  if (arr.length < count) throw new Error(`Not enough items in array: ${arr.length} < ${count}`)
  const copy = [...arr]
  return takeManyRandom(copy, count)
}

export function takeRandom<T> (arr: T[]): T {
  if (arr.length < 1) throw new Error(`Not enough items in array: ${arr.length}`)
  return takeManyRandom(arr, 1)[0]
}

export function takeManyRandom<T> (arr: T[], count: number): T[] {
  if (arr.length < count) throw new Error(`Not enough items in array: ${arr.length} < ${count}`)
  const out: T[] = []
  while (out.length < count) {
    const i = Math.floor(Math.random() * arr.length)
    out.push(arr.splice(i, 1)[0] as T)
  }
  return out
}