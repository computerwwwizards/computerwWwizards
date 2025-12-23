import { ChildPreProcessDependencyContainerWithUse, PreProcessDependencyContainerWithUse } from "./pre-process-dependency-container";
import { PlainObject } from "./types";

//TODO: apply  cleaup execution model
//TODO: apply subplugin option in lazy plugins
// TODO: rapply plugins or subplugins
// TODO: change model to make plugins distingishable by a token to request them
// TODO: create a interface

/**
 * A plugin function that can optionally have sub-plugins attached as properties
 */
export type PluginWithSubPlugins<Context> = ((ctx: Context) => void) & { 
  [key: string]: ((ctx: Context) => void) | undefined 
}

/**
 * A plugin can be either a simple function or a function with sub-plugins
 */
export type Plugin<Context> = ((ctx: Context) => void) | PluginWithSubPlugins<Context>

/**
 * Plugin type specifically for BasicContainer
 */
export type BasicContainerPlugin<T extends PlainObject> = Plugin<BasicContainer<T>>

/**
 * Plugin type specifically for BasicChildContainer
 */
export type BasicChildContainerPlugin<T extends PlainObject, R extends PlainObject> = Plugin<BasicChildContainer<T, R>>

export class BasicContainer<T extends PlainObject> extends PreProcessDependencyContainerWithUse<T> {
  private currentSubpluginName: string | undefined;
  private lazyPlugins = new Set<BasicContainerPlugin<T>>();
  private pluginsByTag = new Map<string, BasicContainerPlugin<T>>()
  /**
     * 
     * If the plugin passed has a mock, now that is used
     * it is not retoractive, it only affects to registration of plugins
     * below the invocation of this method
     * 
     * If the callback doest have a mock callback, the original 
     * callback is used
     * 
     * @example
     * 
     * const plugin = (ctx)=>{
     *    throw new Error("not implemented")
     * }
     * 
     * plugin.mock = (ctx)=>{
     *    ctx.bind("someToken", {
     *      provider(){
     *        return {
     *          // some mock implementation
     *        }
     *      }
     *    })
     * }
     * 
     * const container = new Container();
     * 
     * // will work
     * container
     *  .useMocks()
     *  .use(plugin)
     * 
     * // will throw an error
     * container
     *   .use(plugin)
     *   .useMocks()
     */
  useMocks() {
    this.currentSubpluginName = "mock";


    return this;
  }


  override use(...args: BasicContainerPlugin<T>[]) {
    const pluginName = this.currentSubpluginName;
  
    super.use(...(pluginName ? (args.map((cb) => (cb as any)[pluginName] ?? cb)) : args));


    return this;
  }

  useSubPlugin(name: string){
    this.currentSubpluginName = name;
    return this;
  }

  registerPlugin(plugin: BasicContainerPlugin<T>, tags?: string[]){
    this.lazyPlugins.add(plugin);

    tags?.forEach((tag)=>{
      this.pluginsByTag.set(tag, plugin)
    }, this)

    return this;
  }

  applyPlugins(tags?: string[]){
    const plugins =  tags
      ?.map((tag)=>this.pluginsByTag.get(tag)!, this) ?? this.lazyPlugins.values();
    
    this.use(...plugins)

    return this;
  }
}

export class BasicChildContainer<
  T extends PlainObject,
  R extends PlainObject
> extends ChildPreProcessDependencyContainerWithUse<T, R> {
  private currentSubpluginName: string | undefined;
  private lazyPlugins = new Set<BasicChildContainerPlugin<T, R>>();
  private pluginsByTag = new Map<string, BasicChildContainerPlugin<T, R>>()
  /**
     * 
     * If the plugin passed has a mock, now that is used
     * it is not retoractive, it only affects to registration of plugins
     * below the invocation of this method
     * 
     * If the callback doest have a mock callback, the original 
     * callback is used
     * 
     * @example
     * 
     * const plugin = (ctx)=>{
     *    throw new Error("not implemented")
     * }
     * 
     * plugin.mock = (ctx)=>{
     *    ctx.bind("someToken", {
     *      provider(){
     *        return {
     *          // some mock implementation
     *        }
     *      }
     *    })
     * }
     * 
     * const container = new Container();
     * 
     * // will work
     * container
     *  .useMocks()
     *  .use(plugin)
     * 
     * // will throw an error
     * container
     *   .use(plugin)
     *   .useMocks()
     */
  useMocks() {
    this.currentSubpluginName = "mock";


    return this;
  }


  override use(...args: BasicChildContainerPlugin<T, R>[]) {
    const subPluginName = this.currentSubpluginName;

    super.use(...(subPluginName ? (args.map((cb) => (cb as any)[subPluginName] ?? cb)) : args));


    return this;
  }

  useSubPlugin(name: string){
    this.currentSubpluginName = name;
    return this;
  }

  registerPlugin(plugin: BasicChildContainerPlugin<T, R>, tags?: string[]){
    this.lazyPlugins.add(plugin);

    tags?.forEach((tag)=>{
      this.pluginsByTag.set(tag, plugin)
    }, this)

    return this;
  }

  applyPlugins(tags?: string[]){
    const plugins =  tags
      ?.map((tag)=>this.pluginsByTag.get(tag)!, this) ?? this.lazyPlugins.values();
    
    this.use(...plugins)

    return this;
  }
}


