"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectsPlugin = void 0;
const non_secure_1 = require("nanoid/non-secure");
const timeline_1 = require("./timeline");
/**
 * Generate the data POJO to persist from a Timeline instance.
 * @return - Object with a unique `id`, `duration` in seconds & `queue` array.
 */
const getData = (timeline) => ({
    id: non_secure_1.nanoid(8),
    duration: timeline.duration(),
    queue: timeline.getQueue(),
});
/**
 * Create a boardgame.io plugin that will provide an “effects” API.
 * @param config - Configuration object
 * @return - boardgame.io plugin object
 */
exports.EffectsPlugin = (config) => {
    const plugin = {
        name: 'effects',
        setup: () => getData(new timeline_1.Timeline()),
        api: () => {
            const api = { timeline: new timeline_1.Timeline() };
            for (const type in config.effects) {
                if (type === 'timeline') {
                    throw new RangeError('Cannot create effect type “timeline”. Name is reserved.');
                }
                const { create, duration: defaultDuration } = config.effects[type];
                api[type] = (...args) => {
                    const effect = create ? { type, payload: create(args[0]) } : { type };
                    const [position, duration = defaultDuration] = create
                        ? args.slice(1)
                        : args;
                    api.timeline.add(effect, position, duration);
                };
            }
            return api;
        },
        flush: ({ api }) => getData(api.timeline),
    };
    return plugin;
};
