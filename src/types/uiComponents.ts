export type TableAlign = "start" | "center" | "end";
export type TableColumn<T> = {
  title: string;
  key: string; // VDataTable column key
  align?: TableAlign; // affects header title alignment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: (item: T) => any; // optional cell extractor for simple cells
};
