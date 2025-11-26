export function getRandom (arr: any[], count = 1) {
  if (arr.length < count) throw new Error(`Not enough items in array: ${arr.length} < ${count}`)
  const copy = [...arr]
  const out = [] as any[]
  while (out.length < count) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}