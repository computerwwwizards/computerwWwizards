import type { IServiceA } from "./types";

export class ServiceA implements IServiceA {
  someOp(): void {
    throw new Error("Method not implemented.");
  }
}