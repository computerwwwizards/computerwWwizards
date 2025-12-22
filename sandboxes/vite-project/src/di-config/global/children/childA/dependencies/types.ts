import type { ChildPreProcessDependencyContainerWithUse } from "@computerwwwizards/dependency-injection";
import type { GlobalServiceList } from "../../../dependencies/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ChildAServiceList{
  
}

export type ContainerCtx = ChildPreProcessDependencyContainerWithUse<ChildAServiceList, GlobalServiceList>