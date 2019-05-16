import * as path from 'path';
import Auto from '../auto';
import { ILogger } from './logger';
import tryRequire from './try-require';

export type IPluginConstructor = new (options?: any) => IPlugin;

export interface IPlugin {
  name: string;
  apply(auto: Auto): void;
}

export default function loadPlugin(
  [pluginPath, options]: [string, any],
  logger: ILogger
): IPlugin | undefined {
  let plugin = tryRequire(pluginPath) as (
    | IPluginConstructor
    | { default: IPluginConstructor });

  if (!plugin) {
    plugin = tryRequire(
      path.join(process.cwd(), pluginPath)
    ) as IPluginConstructor;
  }

  if (!plugin) {
    plugin = tryRequire(
      path.join('@intuit-auto', pluginPath)
    ) as IPluginConstructor;
  }

  if (!plugin) {
    logger.log.warn(`Could not find plugin: ${pluginPath}`);
    return;
  }

  if ('default' in plugin && plugin.default) {
    return new plugin.default(options);
  }

  return new (plugin as IPluginConstructor)(options);
}