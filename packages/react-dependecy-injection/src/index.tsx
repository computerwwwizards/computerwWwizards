import { createContext, use, useMemo } from 'react'
import type { PlainObject, PreProcessDependencyContainerWithUse } from '@computerwwwizards/dependency-injection'

export function createContainerContext<T extends PlainObject>(){
  const DIcontext = createContext<
    PreProcessDependencyContainerWithUse<T>
  >(null!)

  function useGetContainer(){
    return use(DIcontext)
  }

  function useGetService(identifier: keyof T){
    return useMemo(()=>useGetContainer().get(identifier), [identifier])
  }

  function DefaultContext(){

    return <DIcontext value={}>

    </DIcontext>
  }

  return {
    DIcontext,
    useGetContainer,
    useGetService
  }
}



