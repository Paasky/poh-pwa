import { GameKey, ObjKey } from '@/types/common'

export type EventType = 'settled' | 'cultureEvolved' | 'technologyDiscovered' | 'eraEntered'
export type EventSetting = 'ignore' | 'summary' | 'full'

export type GameEvent = {
  id: string,
  type: EventType,
  player?: GameKey,
  target: ObjKey,
  title: string,
  description?: string,
  read: boolean,
}