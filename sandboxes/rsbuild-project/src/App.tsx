import { createLazyRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import './App.css';

import { routeTree } from './routeTree.gen'



// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
console.log(routeTree.children)

router.routeTree.lazy(()=>Promise.resolve(createLazyRoute('/paulcito')({
  component: ()=><div>Paulcito es paulcito</div>,
})))

routeTree.addChildren({'a': routeTree})
const App = () => {
  return (
    <RouterProvider router={router} />
  );
};

export default App;
