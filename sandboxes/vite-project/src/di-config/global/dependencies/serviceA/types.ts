export interface IServiceA{
  someOp():void;
}

declare module '../types'{
  interface GlobalServiceList{
    serviceA: IServiceA;
  }
}