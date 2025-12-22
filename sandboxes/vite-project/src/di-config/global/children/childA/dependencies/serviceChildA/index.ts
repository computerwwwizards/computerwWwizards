import type { ContainerCtx } from "../types";

export default function containerHanlder(ctx: ContainerCtx){
  ctx.bind('serviceChildA', {
    provider() {
      return {
        someNewOp() {}
      }
    },
  })
}