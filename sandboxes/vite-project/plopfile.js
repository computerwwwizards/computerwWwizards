/**
 * @param {import('plop').NodePlopAPI} plop 
 */
export default function generator(plop){
  plop.setGenerator('create-di-container', {
    description: 'Bootstrap a DI container',
    prompts: [
      {
        type: 'input',
        name: 'rootPath',
        message: 'the root path for the folder containing all the files'
      },
      {
        
      }
    ]
  })
}