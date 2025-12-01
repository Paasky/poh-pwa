import { ObjKey } from "@/types/common";
import { TypeClass, TypeObject } from "@/types/typeObjects";

export class Requires {
  private _requireAll: ObjKey[] = [];
  private _requireAny: ObjKey[][] = [];
  private _allTypes: ObjKey[] = [];

  constructor(requires: ObjKey[] | ObjKey[][] = []) {
    for (const r of requires) {
      if (Array.isArray(r)) {
        this._requireAny.push(r);
        this._allTypes.push(...r);
      } else {
        this._requireAll.push(r);
        this._allTypes.push(r);
      }
    }
  }

  get allTypes(): ObjKey[] {
    return this._allTypes;
  }

  get isEmpty(): boolean {
    return this._allTypes.length === 0;
  }

  get requireAll(): ObjKey[] {
    return this._requireAll;
  }

  get requireAny(): ObjKey[][] {
    return this._requireAny;
  }

  isSatisfied(types: TypeObject[]): boolean {
    // Need to check type.key, type.category && type.concept

    // At least one of the given objects must match each "require all"-keys
    for (const require of this._requireAll) {
      if (!types.some((t) => t.key === require || t.category === require || t.concept === require))
        return false;
    }

    // At least one of the given objects must match any "require any"-key
    for (const require of this._requireAny) {
      if (
        !types.some(
          (t) =>
            require.includes(t.key) ||
            (t.category && require.includes(t.category)) ||
            require.includes(t.concept),
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

    for (const reqAny of this._requireAny) {
      for (const req of reqAny) {
        if (classes.some((c) => req.startsWith(`${c}:`))) {
          any.push(reqAny);
          break;
        }
      }
    }

    return new Requires([...all, ...any] as ObjKey[] | ObjKey[][]);
  }
}
