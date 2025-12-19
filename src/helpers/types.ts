import { TypeObject } from "@/types/typeObjects";
import { TypeKey } from "@/types/common";
import { useObjectsStore } from "@/stores/objectStore";

export function typeTimeline(type: TypeObject): TypeObject[] {
  let timeline = [type];
  let needle = undefined as TypeKey | undefined;
  let needleType = type as TypeObject | undefined;
  do {
    needle = needleType!.upgradesFrom.find((from) => from.startsWith(type.class + ":"));
    needleType = needle ? useObjectsStore().getTypeObject(needle) : undefined;
    if (needleType) {
      timeline = [needleType, ...timeline];
    }
  } while (needleType);

  needleType = type as TypeObject;
  do {
    needle = needleType!.upgradesTo.find((to) => to.startsWith(type.class + ":"));
    needleType = needle ? useObjectsStore().getTypeObject(needle) : undefined;
    if (needleType) {
      timeline.push(needleType as TypeObject);
    }
  } while (needleType);

  return timeline;
}
