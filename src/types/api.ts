export interface GameData {
  categories: any[]
  types: any[]
}

export interface SaveData {
  id: string
  turn: number
  size: {x: number, y: number}
  currentPlayer: string
  objects: any[]
}