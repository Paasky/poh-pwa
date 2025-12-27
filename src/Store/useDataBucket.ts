import { DataBucket } from "@/Store/DataBucket";

let dataBucket: undefined | DataBucket = undefined;

export function setDataBucket(bucket: DataBucket): DataBucket {
  return (dataBucket = bucket);
}

export function useDataBucket(): DataBucket {
  if (!dataBucket) throw new Error("DataBucket not set");
  return dataBucket;
}

export function destroyDataBucket(): void {
  // todo actually destroy all objects to prevent memory leaks during testing? (prob not any real problem to care about?)
  dataBucket = undefined;
}
