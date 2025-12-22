import type { ContainerCtx } from '../types';
import { MockServiceA } from './MockServiceA';
import { ServiceA } from './ServiceA';

export default function containerHandler(container: ContainerCtx){
  container
    .bind('serviceA', {
      provider() {
        return new ServiceA();
      },
      resolveDependencies() {
        
      },
      scope: 'transient'
    })
}

function mockHandler(container: ContainerCtx){
  container
    .bind('serviceA', {
      provider(){
        return new MockServiceA();
      }
    })
}

containerHandler.mock = mockHandler;