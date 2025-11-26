/// <reference types="node" />
// Run the Terra example generator and print a simple text map
// Legend per tile:
//   ~  terrain is ocean
//   @  terrain is sea
//   else first letter of terrain id, uppercase

import { createPinia, setActivePinia } from 'pinia'
import staticData from '../public/staticData.json'
import { useObjectsStore } from '../src/stores/objectStore'

function tileChar (tile: { terrain: { id: string } }): string {
  const id = tile.terrain.id
  if (!id) throw new Error(`bad tile: ${JSON.stringify(tile)}`)
  if (id === 'ocean') return '~'
  if (id === 'sea') return ':'
  return (id[0]).toUpperCase()
}

async function main () {
  // Bootstrap Pinia and initialize static types
  setActivePinia(createPinia())
  const objects = useObjectsStore()
  objects.initStatic(staticData)

  // Import after Pinia is active to avoid store access before initialization
  const { example } = await import('../src/factories/TerraGenerator/terraGenerator')
  const { Tile } = await import('../src/objects/gameObjects')

  const gen = example()

  // Print strat-level map
  const { stratSize, stratTiles } = gen

  const stratLines: string[] = []
  for (let y = 0; y < stratSize.y; y++) {
    let line = ''
    for (let x = 0; x < stratSize.x; x++) {
      const key = Tile.getKey(x, y)
      const tile = stratTiles[key]
      if (!tile) throw new Error(`missing tile: ${key}`)
      if (tile) {
        line += ` ${tileChar(tile)} `
      } else {
        line += ' x '
      }
    }
    stratLines.push(line)
  }
  console.log(stratLines.join('\n'))

  console.log('\n---------------------------------------\n')

  // Print reg-level map
  const { regSize, regTiles } = gen

  const regLines: string[] = []
  for (let y = 0; y < regSize.y; y++) {
    let line = ''
    for (let x = 0; x < regSize.x; x++) {
      const key = Tile.getKey(x, y)
      const tile = regTiles[key]
      if (!tile) throw new Error(`missing tile: ${key}`)
      if (tile) {
        line += ` ${tileChar(tile)} `
      } else {
        line += ' x '
      }
    }
    regLines.push(line)
  }
  console.log(regLines.join('\n'))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
