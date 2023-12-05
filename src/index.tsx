import { ZodError, z } from "zod"
import { memo, useCallback } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim"

export type OnSubmitProps<State> = {
    state: State
    errors: ZodError<State> | null
    touchedFields: string[]
}

export type CreateStoreProps<State, Schema> = {
    initialState: State
    schema: Schema
}

export type CreateFormProps<State, Schema> = {
    initialState: State
    schema: Schema
    onSubmit: (props: OnSubmitProps<State>) => Promise<void> | void
}

export type Update<S> = S | ((state: S) => S)
export type Subscriber<S> = (state: S) => void
export type Selector<S, R> = (state: S) => R

const track = <S, R>(selector: Selector<S, R>): string[] => {
    const path: string[] = []
    const handler: ProxyHandler<any> = {
        get(_, p) {
            path.push(p as string)
            return new Proxy({}, handler)
        }
    }
    const proxy = new Proxy({}, handler)
    selector(proxy)
    return path
}

const setNestedValue = <State,>(obj: State, path: string[], update: Update<State>): State => {
    if (path.length === 0) {
        return update instanceof Function ? update(obj) : update;
    }

    const [head, ...tail] = path;
    const isArray = Array.isArray(obj);
    const isUpdateAtIndex = isArray && !isNaN(parseInt(head));

    if (isUpdateAtIndex) {
        return [
            ...obj.slice(0, parseInt(head)),
            setNestedValue(obj[parseInt(head)], tail, update),
            ...obj.slice(parseInt(head) + 1)
        ] as State;
    } else {
        return {
            ...obj,
            [head]: setNestedValue((obj as any)[head], tail, update),
        };
    }
};

const getNestedValue = (obj: any, path: string[]): any => {
    if (obj == null || path.length === 0) {
        return undefined;
    }
    const [head, ...tail] = path;
    if (path.length === 1) {
        return obj[head];
    }
    return getNestedValue(obj[head], tail);
}

const createStore = <State,>(initialState: State) => {
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

const typedMemo: <A, B>(a: A, B: B) => A = memo;

export const createForm = <
    Schema extends z.ZodSchema,
>({
    schema,
    onSubmit,
    initialState
}: CreateFormProps<z.infer<Schema>, Schema>) => {
    type State = z.infer<Schema>
    const store = createStore(initialState)
    const touchedStore = createStore<string[]>([])
    const parsed = schema.safeParse(initialState)
    let errors: z.ZodError<State> | null = parsed.success ? null : parsed.error
    const getErrors = () => errors;

    type ExternalSubscriberArgs = { state: State; errors: z.ZodError<State> | null; touchedFields: string[] }

    const externalSubscribers = new Set<Subscriber<ExternalSubscriberArgs>>();
    store.subscribe((state) => {
        const parsed = schema.safeParse(state)
        errors = parsed.success ? null : parsed.error
        externalSubscribers.forEach(listener => listener({ state, errors, touchedFields: touchedStore.getState() }))
    })

    const subscribeExternal = (s: Subscriber<ExternalSubscriberArgs>) => {
        externalSubscribers.add(s);
        return () => externalSubscribers.delete(s);
    }

    const getErrorForPath = (errors: ZodError<State> | null, path: string[]): string[] => {
        if (!errors || path.length === 0) return [];

        const matchingErrors = errors.errors.filter(error =>
            error.path.length >= path.length &&
            path.every((segment, index) => error.path[index] == segment)
        );

        return matchingErrors.map(error => error.message);
    };

    const useField = <R,>(selector: Selector<State, R>) => {
        const path = track(selector)
        const joinedPath = path.join(".")
        const errors = getErrorForPath(getErrors(), path);
        const getSnap = useCallback(() => getNestedValue(store.getState(), path) as R, [joinedPath])
        const getTouchedSnap = useCallback(() => touchedStore.getState().includes(joinedPath), [joinedPath])
        const value = useSyncExternalStore(store.subscribe, getSnap, getSnap)
        const isTouched = useSyncExternalStore(touchedStore.subscribe, getTouchedSnap, getTouchedSnap)

        const setValue = useCallback((update: Update<R>) => {
            store.setState((prevState) => setNestedValue(prevState, path, update));
        }, [joinedPath])

        const setIsTouched = useCallback((update: Update<boolean>) => {
            touchedStore.setState((prevState) => {
                const prev = prevState.includes(joinedPath)
                const next = update instanceof Function ? update(prev) : update

                if (next) {
                    return [...new Set([...prevState, joinedPath])]
                } else {
                    return prevState.filter(k => k !== joinedPath)
                }
            });
        }, [joinedPath])

        return {
            value,
            setValue,
            isTouched,
            setIsTouched,
            errors,
        }
    }

    type FieldProps<R> = {
        selector: Selector<State, R>
        children: (props: ReturnType<typeof useField<R>>) => JSX.Element
    }
    const Field = typedMemo(<R,>({ selector, children }: FieldProps<R>) => {
        const props = useField(selector)
        return children(props)
    }, (a: any, b: any) => {
        const trackA = track(a.selector).join("")
        const trackB = track(b.selector).join("")
        return Object.is(trackA, trackB) && Object.is(a.children, b.children)
    })

    const submit = () => {
        onSubmit({
            state: store.getState(),
            errors: getErrors(),
            touchedFields: touchedStore.getState()
        })
    }

    return {
        useField,
        Field,
        getErrors,
        getTouchedFields: touchedStore.getState,
        setTouchedFields: touchedStore.setState,
        getState: store.getState,
        setState: store.setState,
        subscribe: subscribeExternal,
        submit
    }
}
