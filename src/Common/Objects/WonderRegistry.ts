import { TypeKey } from "@/Common/Static/StaticEnums";

export class WonderRegistry {
  private claimedWorldWonders = new Set<TypeKey>();

  claim(wonderTypeKey: TypeKey): void {
    this.claimedWorldWonders.add(wonderTypeKey);
  }

  release(wonderTypeKey: TypeKey): void {
    this.claimedWorldWonders.delete(wonderTypeKey);
  }

  isClaimed(wonderTypeKey: TypeKey): boolean {
    return this.claimedWorldWonders.has(wonderTypeKey);
  }

  get claimed(): Set<TypeKey> {
    return new Set(this.claimedWorldWonders);
  }

  clear(): void {
    this.claimedWorldWonders.clear();
  }
}
