import { type ZodError, z } from "zod"
import { useCallback, useEffect, memo } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim"

export type FieldMetaProps = {
    touched?: boolean
    dirty?: boolean
    disabled?: boolean
    visible?: boolean
    loading?: boolean
    required?: boolean
}

export type FieldOptions = {
    onFocus?: () => void
}

export type OnSubmitProps<State> = {
    state: State
    errors: ZodError<State> | null
}

export type CreateStoreProps<State, Schema> = {
    initialState: State
    schema: Schema
}

export type CreateFormProps<State, Schema> = {
    initialState: State
    schema: Schema
    onSubmit: (props: OnSubmitProps<State>) => Promise<void>
    storageKey?: string
}

export type Update<S> = S | ((state: S) => S)
export type Subscriber<S> = (state: S) => void
export type Selector<S, R> = (state: S) => R

const typedMemo: <A, B>(a: A, B: B) => A = memo;

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

export const createForm = <
    Schema extends z.ZodSchema,
>({
    schema,
    onSubmit,
    storageKey,
    initialState
}: CreateFormProps<z.infer<Schema>, Schema>) => {
    type State = z.infer<Schema>
    const storedState = !!localStorage && !!storageKey ? localStorage.getItem(storageKey) : null

    const store = createStore(storedState ? JSON.parse(storedState) as State : initialState)
    const metaStore = createStore<Record<string, FieldMetaProps | undefined>>({})

    const parsed = schema.safeParse(initialState)
    let errors: z.ZodError<State> | null = parsed.success ? null : parsed.error
    const getErrors = () => errors;
  
    type SubscriberArg = { state: State; errors: z.ZodError<State> | null; }

    const subscribers = new Set<Subscriber<SubscriberArg>>();
    store.subscribe((state) => {
        const parsed = schema.safeParse(state)
        errors = parsed.success ? null : parsed.error
        subscribers.forEach(listener => listener({ state, errors }))
        
        if(!!storageKey && !!localStorage) {
            localStorage.setItem(storageKey, JSON.stringify(state))
        }
    })

    const subscribe = (s: Subscriber<SubscriberArg>) => {
        subscribers.add(s);
        return () => subscribers.delete(s);
    }

    const getErrorForPath = (errors: ZodError<State> | null, path: string[]): string[] => {
        if (!errors || path.length === 0) return [];

        const matchingErrors = errors.errors.filter(error =>
            error.path.length >= path.length &&
            path.every((segment, index) => error.path[index] == segment)
        );

        return matchingErrors.map(error => error.message);
    };

    const setFieldValue = <R,>(selector: Selector<State, R>, update: Update<R>) => {
        store.setState((prevState) => setNestedValue(prevState, track(selector), update));
    }

    const isSubmitting = createStore(false)

    const useIsSubmitting = () => {
        return useSyncExternalStore(isSubmitting.subscribe, isSubmitting.getState, isSubmitting.getState)
    }

    const focusListeners: Map<string, () => void> = new Map()
    const focus = <R,>(selector: Selector<State, R>) => {
        const joinedPath = track(selector).join(".")
        const listener = focusListeners.get(joinedPath)
        if(!!listener) {
            listener()
        }
    }

    const useField = <R,>(selector: Selector<State, R>, options?: FieldOptions) => {
        const path = track(selector)
        const joinedPath = path.join(".")
        const errors = getErrorForPath(getErrors(), path);
        const getSnap = useCallback(() => getNestedValue(store.getState(), path) as R, [joinedPath])
        const getMeta = useCallback(() => {
            const v = metaStore.getState()[joinedPath]
            return !!v ? v : undefined
        }, [joinedPath])
        const value = useSyncExternalStore(store.subscribe, getSnap, getSnap)
        const meta = useSyncExternalStore(metaStore.subscribe, getMeta, getMeta)
        const setValue = useCallback((update: Update<R>) => {
            setFieldValue(selector, update)
        }, [joinedPath])

        const setMeta = useCallback((update: Update<FieldMetaProps | undefined>) => {
            metaStore.setState((prev) => {
                const prevVal = prev[joinedPath]
                const next = update instanceof Function ? update(prevVal) : update
                if(
                    next?.dirty != prevVal?.dirty ||
                    next?.disabled != prevVal?.disabled || 
                    next?.loading != prevVal?.loading || 
                    next?.required != prevVal?.required || 
                    next?.touched != prevVal?.touched || 
                    next?.visible != prevVal?.visible
                ) {
                    return { ...prev, [joinedPath]: next }
                }

                return prev
            });
        }, [joinedPath])

        useEffect(() => {
            if(typeof options?.onFocus === 'function') {
                focusListeners.set(joinedPath, options.onFocus)
            }
            return () => focusListeners.delete(joinedPath)
        })

        const onFocus = useCallback(() => focus(selector),[joinedPath])

        return {
            value,
            setValue,
            errors,
            meta,
            setMeta,
            focus: onFocus
        }
    }

    type FieldProps<R> = {
        selector: Selector<State, R>
        children: (props: ReturnType<typeof useField<R>>) => JSX.Element
    } & FieldOptions
    const Field = typedMemo(<R,>({ selector, children, onFocus }: FieldProps<R>) => {
        const props = useField(selector, { onFocus })
        return children(props)
    }, (a: any, b: any) => {
        const trackA = track(a.selector).join("")
        const trackB = track(b.selector).join("")
        return Object.is(trackA, trackB) && Object.is(a.children, b.children)
    })

    const submit = () => {
        isSubmitting.setState(true)
        onSubmit({
            state: store.getState(),
            errors: getErrors(),
        }).finally(() => {
            isSubmitting.setState(false)
        })
    }

    return {
        useField,
        setFieldValue,
        Field,
        getErrors,
        useIsSubmitting,
        isSubmitting: isSubmitting.getState,
        getMetaState: metaStore.getState,
        setMetaState: metaStore.setState,
        getState: store.getState,
        setState: store.setState,
        subscribe,
        focus,
        submit
    }
}
