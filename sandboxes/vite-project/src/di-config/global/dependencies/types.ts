import type { PreProcessDependencyContainerWithUse } from "@computerwwwizards/dependency-injection";


// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GlobalServiceList{ 
}

export type ContainerCtx = PreProcessDependencyContainerWithUse<GlobalServiceList>