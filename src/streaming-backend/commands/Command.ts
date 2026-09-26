export interface Command<T extends string> {
  type: T;
  id: string;
}
