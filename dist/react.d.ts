import React from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { EffectsPluginConfig, ListenerArgs } from './types';
/**
 * Configuration options that can be passed to EffectsBoardWrapper.
 */
interface EffectsOpts {
    speed?: number;
    updateStateAfterEffects?: boolean;
}
/**
 * Returns a component that will render your board wrapped in
 * an effect emitting context provider.
 * @param board - The board component to wrap.
 * @param opts  - Optional object to configure options for effect emitter.
 *
 * @example
 * import { EffectsBoardWrapper } from 'bgio-effects'
 * import MyBoard from './board.js'
 * const BoardWithEffects = EffectsBoardWrapper(MyBoard)
 */
export declare function EffectsBoardWrapper<G extends any = any, P extends BoardProps<G> = BoardProps<G>>(Board: React.ComponentType<P>, opts?: EffectsOpts): React.ComponentType<P>;
/**
 * Subscribe to events emitted by the effects state.
 * @param effectType - Name of the effect to listen for. '*' listens to any.
 * @param callback - Function to call when the event is emitted.
 * @param dependencyArray - Array of variables the callback function depends on.
 */
export declare function useEffectListener<C extends EffectsPluginConfig>(...args: ListenerArgs<C['effects']>): void;
/**
 * Get controls and data for the effects queue.
 * @return - { clear(), flush(), size }
 */
export declare function useEffectQueue(): {
    clear: () => void;
    flush: () => void;
    size: number;
};
export {};
