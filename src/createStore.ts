import type { Subscriber, Update } from ".";

export const createStore = <State>(initialState: State) => {
    let state = initialState;
    const getState = () => state;
    const subscribers = new Set<Subscriber<State>>();
    const setState = (update: Update<State>) => {
        state = update instanceof Function ? update(state) : update
        subscribers.forEach((l) => l(getState()));
    };

    const subscribe = (s: Subscriber<State>) => {
        subscribers.add(s);
        return () => subscribers.delete(s);
    };

    return { getState, setState, subscribe };
};
