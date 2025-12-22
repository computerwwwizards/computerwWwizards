import { ChildPreProcessDependencyContainerWithUse } from "@computerwwwizards/dependency-injection";
import type { GlobalServiceList, ContainerCtx as ParentContainerCtx } from "../../dependencies/types";
import type { ContainerCtx, ChildAServiceList } from "./dependencies/types";
import containerHanlder from "./dependencies/serviceChildA";

export default function setupContainer(parentContainer: ParentContainerCtx){
  const container: ContainerCtx = new ChildPreProcessDependencyContainerWithUse<
    ChildAServiceList, 
    GlobalServiceList
  >(parentContainer)

  return container
    .use(
      containerHanlder,
    )
}