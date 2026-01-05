import { ObjKey } from "@/Common/Objects/Common";
import { TypeClass, TypeObject } from "@/Common/Objects/TypeObject";

export class Requires {
  private _requireAll: Set<ObjKey> = new Set();
  private _requireAny: Set<Set<ObjKey>> = new Set();
  private _allTypes: Set<ObjKey> = new Set();

  constructor(requires: (ObjKey | ObjKey[])[] = []) {
    for (const r of requires) {
      if (Array.isArray(r)) {
        const anySet = new Set(r);
        this._requireAny.add(anySet);
        r.forEach((item) => this._allTypes.add(item));
      } else {
        this._requireAll.add(r);
        this._allTypes.add(r);
      }
    }
  }

  get allTypes(): Set<ObjKey> {
    return this._allTypes;
  }

  get isEmpty(): boolean {
    return this._allTypes.size === 0;
  }

  get requireAll(): Set<ObjKey> {
    return this._requireAll;
  }

  get requireAny(): Set<Set<ObjKey>> {
    return this._requireAny;
  }

  isSatisfied(types: Set<TypeObject>): boolean {
    // Need to check type.key, type.category && type.concept

    // At least one of the given objects must match each "require all"-keys
    for (const require of this._requireAll) {
      if (
        ![...types].some(
          (t) => t.key === require || t.category === require || t.concept === require,
        )
      )
        return false;
    }

    // At least one of the given objects must match any "require any"-key
    for (const requireAnySet of this._requireAny) {
      if (
        ![...types].some(
          (t) =>
            requireAnySet.has(t.key) ||
            (t.category && requireAnySet.has(t.category)) ||
            requireAnySet.has(t.concept),
        )
      )
        return false;
    }

    // Both checks pass
    return true;
  }

  filter(classes: TypeClass[]): Requires {
    const all: ObjKey[] = [];
    const any: ObjKey[][] = [];

    for (const req of this._requireAll) {
      if (classes.some((c) => req.startsWith(`${c}:`))) {
        all.push(req);
      }
    }

    for (const reqAnySet of this._requireAny) {
      const reqAny = [...reqAnySet];
      for (const req of reqAny) {
        if (classes.some((c) => req.startsWith(`${c}:`))) {
          any.push(reqAny);
          break;
        }
      }
    }

    return new Requires([...all, ...any]);
  }
}
