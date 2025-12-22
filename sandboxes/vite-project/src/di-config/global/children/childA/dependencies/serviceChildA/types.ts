export interface IServiceChildA {
  someNewOp():void;
}

declare module '../types'{
  interface ChildAServiceList{
    serviceChildA:IServiceChildA;
  }
}