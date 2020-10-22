"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEffectQueue = exports.useEffectListener = exports.EffectsBoardWrapper = void 0;
const react_1 = __importStar(require("react"));
const useRafLoop_1 = __importDefault(require("react-use/lib/useRafLoop"));
const useUpdate_1 = __importDefault(require("react-use/lib/useUpdate"));
const mitt_1 = __importDefault(require("mitt"));
const EffectsContext = react_1.default.createContext(null);
const EffectsQueueContext = react_1.default.createContext(undefined);
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
function EffectsBoardWrapper(Board, opts) {
    return function BoardWithEffectsProvider(props) {
        return EffectsProvider({ props, Board, opts });
    };
}
exports.EffectsBoardWrapper = EffectsBoardWrapper;
/**
 * Get an error message for when a hook has been used outside a provider.
 * @param hook - The name of the hook that errored.
 * @return - Error message string.
 */
const hookErrorMessage = (hook) => hook +
    ' must be called inside the effects context provider.\n' +
    'Make sure your board component has been correctly wrapped using EffectsBoardWrapper.';
/**
 * Subscribe to events emitted by the effects state.
 * @param effectType - Name of the effect to listen for. '*' listens to any.
 * @param callback - Function to call when the event is emitted.
 * @param dependencyArray - Array of variables the callback function depends on.
 */
function useEffectListener(...args) {
    const emitter = react_1.useContext(EffectsContext);
    if (!emitter)
        throw new Error(hookErrorMessage('useEffectListener'));
    const [effectType, cb, deps] = args;
    const callback = react_1.useCallback(cb, deps);
    react_1.useEffect(() => {
        let cleanup;
        emitter.on(effectType, (...args) => {
            if (typeof cleanup === 'function')
                cleanup();
            cleanup = callback(...args);
        });
        return () => {
            emitter.off(effectType, callback);
            if (typeof cleanup === 'function')
                cleanup();
        };
    }, [emitter, effectType, callback]);
}
exports.useEffectListener = useEffectListener;
/**
 * Get controls and data for the effects queue.
 * @return - { clear(), flush(), size }
 */
function useEffectQueue() {
    const ctx = react_1.useContext(EffectsQueueContext);
    if (!ctx)
        throw new Error(hookErrorMessage('useEffectQueue'));
    return ctx;
}
exports.useEffectQueue = useEffectQueue;
/**
 * Context provider that watches boardgame.io state and emits effect events.
 */
function EffectsProvider({ Board, props, opts: { speed = 1, updateStateAfterEffects = false } = {}, }) {
    const { effects } = props.plugins;
    const id = effects && effects.data.id;
    const duration = (effects && effects.data.duration) || 0;
    const bgioStateT = updateStateAfterEffects ? duration : 0;
    const [prevId, setPrevId] = react_1.useState(id);
    const [emitter] = react_1.useState(() => mitt_1.default());
    const [startT, setStartT] = react_1.useState(0);
    const [bgioProps, setBgioProps] = react_1.useState(props);
    const queue = react_1.useRef([]);
    const rerender = useUpdate_1.default();
    const setQueue = react_1.useCallback((newQueue) => {
        queue.current = newQueue;
        rerender();
    }, [queue, rerender]);
    /**
     * requestAnimationFrame loop which dispatches effects and updates the queue
     * every tick while active.
     */
    const [stopRaf, startRaf, isRafActive] = useRafLoop_1.default(() => {
        const elapsedT = ((performance.now() - startT) / 1000) * speed;
        const q = queue.current;
        // Loop through the effects queue, emitting any effects whose time has come.
        let i = 0;
        for (i = 0; i < q.length; i++) {
            const effect = q[i];
            if (!effect || effect.t > elapsedT)
                break;
            emitter.emit(effect.type, effect.payload);
        }
        // Also update the global boardgame.io props once their time is reached.
        if (elapsedT >= bgioStateT && props !== bgioProps)
            setBgioProps(props);
        if (elapsedT > duration)
            stopRaf();
        // Update the queue to only contain effects still in the future.
        if (i > 0)
            setQueue(q.slice(i));
    }, false);
    /**
     * Update the queue state when a new update is received from boardgame.io.
     */
    react_1.useEffect(() => {
        if (!effects || id === prevId) {
            // If some non-game state props change, or the effects plugin is not
            // enabled, still update boardgame.io props for the board component.
            if ((!updateStateAfterEffects || !isRafActive()) && props !== bgioProps) {
                setBgioProps(props);
            }
            return;
        }
        setPrevId(effects.data.id);
        setQueue(effects.data.queue);
        setStartT(performance.now());
        startRaf();
    }, [
        effects,
        id,
        prevId,
        updateStateAfterEffects,
        isRafActive,
        props,
        bgioProps,
        setQueue,
        startRaf,
    ]);
    /**
     * Callback that clears the effect queue, cancelling future effects.
     */
    const clear = react_1.useCallback(() => {
        stopRaf();
        setQueue([]);
        if (props !== bgioProps)
            setBgioProps(props);
    }, [props, bgioProps, stopRaf, setQueue]);
    /**
     * Callback that immediately emits all remaining effects and clears the queue.
     */
    const flush = react_1.useCallback(() => {
        for (let i = 0; i < queue.current.length; i++) {
            const effect = queue.current[i];
            emitter.emit(effect.type, effect.payload);
        }
        clear();
    }, [emitter, queue, clear]);
    return (react_1.default.createElement(EffectsContext.Provider, { value: emitter },
        react_1.default.createElement(EffectsQueueContext.Provider, { value: { clear, flush, size: queue.current.length } },
            react_1.default.createElement(Board, Object.assign({}, bgioProps)))));
}
