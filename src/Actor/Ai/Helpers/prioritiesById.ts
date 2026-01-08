import { Priority } from "@/Actor/Ai/AiTypes";

export function prioritiesById(
  areas: Set<{ id: string }>,
  priorities: Priority[],
): Map<string, Priority[]> {
  const prioritiesByLocality = new Map<string, Priority[]>();

  areas.forEach((area) =>
    priorities.forEach((priority) => {
      if (priority.targetId && priority.targetId !== area.id) return;
      const areaPriorities = prioritiesByLocality.get(area.id);
      if (areaPriorities) {
        areaPriorities.push(priority);
      } else {
        prioritiesByLocality.set(area.id, [priority]);
      }
    }),
  );

  return prioritiesByLocality;
}
