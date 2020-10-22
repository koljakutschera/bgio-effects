import type { Plugin } from 'boardgame.io';
import type { API, Data, EffectsPluginConfig } from './types';
/**
 * Create a boardgame.io plugin that will provide an “effects” API.
 * @param config - Configuration object
 * @return - boardgame.io plugin object
 */
export declare const EffectsPlugin: <C extends EffectsPluginConfig>(config: C) => Plugin<API<C["effects"]>, Data<C["effects"]>, any>;
