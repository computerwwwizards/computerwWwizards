import { PreProcessDependencyContainerWithUse } from "@computerwwwizards/dependency-injection";
import type { ContainerCtx } from "./dependencies/types";
import serviceAContainerHandler from "./dependencies/serviceA";

export default function setupContainer(container?: ContainerCtx){
  container ??= new PreProcessDependencyContainerWithUse();

  return container
    .use(
      serviceAContainerHandler
    )
}