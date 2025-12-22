import type { ContainerCtx as ChildAContainerCtx } from "./children/childA/dependencies/types";
import type { ContainerCtx as ParentContainerCtx } from "./dependencies/types";

export type fullContainerCtx = ParentContainerCtx
  | ChildAContainerCtx