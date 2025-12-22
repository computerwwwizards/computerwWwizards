import { createContext, use, useMemo, useState, type PropsWithChildren } from 'react'

import './App.css'
import setupGlobalContainer from './di-config/global'
import setupChildChildAContainer from './di-config/global/children/childA'
import type { fullContainerCtx } from './di-config/global/types'

const {
  DIcontext,
  ChildContainerContext
} = createContainer<fullContainerCtx>()

function SubApp() {

  return <ChildContainerContext setupCb={setupChildChildAContainer}/>
}




function createContainer<Container>() {

  const DIcontext = createContext<Container>(null!)

  function useGetContainer<R extends Container>() {
    return use(DIcontext) as R
  }

  function useCreateChildContainer<
    Parent extends Container, 
    Child extends Container
  >(setupCn: (parent: Parent) => Child) {
    const parentContainer = useGetContainer<Parent>()

    const childContainer = useMemo(() => {
      return setupCn(parentContainer)
    }, [setupCn, parentContainer])

    return childContainer;
  }

  interface ContainerContextOwnProps<T> {
    setupCb: (ctx?: T) => T;
  }

  interface ChildContainerContextOwnProps<Parent, Child>{
    setupCb: (parent:Parent)=> Child
  }

  function ContainerContext<T extends Container>({
    setupCb,
    children
  }: PropsWithChildren<ContainerContextOwnProps<T>>) {
    const container = useMemo(() => {
      return setupCb()
    }, [setupCb])

    return <DIcontext
      value={container}>
      {children}
    </DIcontext>
  }

  function ChildContainerContext<Parent extends Container, Child extends Container>({
    setupCb,
    children
  }:PropsWithChildren<ChildContainerContextOwnProps<Parent, Child>>){
    const childContainer = useCreateChildContainer<Parent, Child>(setupCb);

    return <DIcontext value={childContainer}>
      {children}
    </DIcontext>
  }

  return {
    DIcontext,
    useGetContainer,
    useCreateChildContainer,
    ContainerContext,
    ChildContainerContext
  }
}



function App() {
  const [globalContainer] = useState(() => {
    return setupGlobalContainer();
  })

  const onClick = () => {
    const serviceA = globalContainer.get('serviceA')

    if (serviceA)
      console.log('Hello')
  }

  return (
    <DIcontext value={globalContainer}>
      <div>
        <button onClick={onClick} >Click me</button>
      </div>
    </DIcontext>
  )
}

export default App
