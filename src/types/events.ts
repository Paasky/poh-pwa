import { ObjKey } from '@/types/common'

export type EventType = 'settled' | 'cultureEvolved'

export type GameEvent = {
  type: EventType,
  target: ObjKey,
  description: string,
}