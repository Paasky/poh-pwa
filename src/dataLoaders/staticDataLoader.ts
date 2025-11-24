import { useObjectsStore } from '@/stores/objectStore'
import { ObjKey } from '@/types/common'

const objects = useObjectsStore()

export function buildRelations (data: any) {
  // Recursively walk the data structure looking for relations
  if (Array.isArray(data)) {
    data.forEach(i => buildRelations(i))
    return
  }

  // If it's an object, check each value
  if (typeof data === 'object') {
    for (const key of Object.keys(data)) {
      // Only check strings and objects

      // if the key is a relation, convert it to an object reference
      if (typeof data[key] === 'string') {
        if (!data[key].includes(':')) return

        // Could be a relation
        convertString(data, key as ObjKey)
      } else {
        buildRelations(data[key])
      }
    }
    return
  }

  // Not a string or object, so nothing to do
}

function convertString (obj: any, key: ObjKey) {
  try {
    obj[key] = objects.get(obj[key])
  } catch (e) {
    // Ignore errors, just leave the string as-is
  }
}