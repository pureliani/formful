import { ZodError, z } from "zod"
import { useCallback } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim"
import { equals } from "./equals";
import { createStore } from "./createStore";
import { track } from "./track";
import { typedMemo } from "./typedMemo";

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
    onSubmit: (props: OnSubmitProps<State>) => Promise<void>
    storageKey?: string
}

export type Update<S> = S | ((state: S) => S)
export type Subscriber<S> = (state: S) => void
export type Selector<S, R> = (state: S) => R

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

export const createForm = <
    Schema extends z.ZodSchema,
>({
    schema,
    onSubmit,
    storageKey,
    initialState
}: CreateFormProps<z.infer<Schema>, Schema>) => {
    type State = z.infer<Schema>
    const storedState = !!localStorage && !!storageKey  ? localStorage.getItem(storageKey) : null

    let store = createStore(storedState ? JSON.parse(storedState) as State : initialState)
    let _initialState = initialState

    const reinitialize = (state: State) => {
        _initialState = state
        store.setState(state)
    }

    const reset = () => store.setState(_initialState)
    const wasModified = () => !equals(_initialState, store.getState())
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
        
        if(!!storageKey && !!localStorage) {
            localStorage.setItem(storageKey, JSON.stringify(state))
        }
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

    const setFieldValue = <R,>(selector: Selector<State, R>, update: Update<R>) => {
        store.setState((prevState) => setNestedValue(prevState, track(selector), update));
    }

    const isSubmitting = createStore(false)

    const useIsSubmitting = () => {
        return useSyncExternalStore(isSubmitting.subscribe, isSubmitting.getState, isSubmitting.getState)
    }

    const useField = <R,>(selector: Selector<State, R>) => {
        const path = track(selector)
        const joinedPath = path.join(".")
        const errors = getErrorForPath(getErrors(), path);
        const getSnap = useCallback(() => getNestedValue(store.getState(), path) as R, [joinedPath])
        const getTouchedSnap = useCallback(() => touchedStore.getState().includes(joinedPath), [joinedPath])
        const value = useSyncExternalStore(store.subscribe, getSnap, getSnap)
        const isTouched = useSyncExternalStore(touchedStore.subscribe, getTouchedSnap, getTouchedSnap)
        const wasModified = useCallback(() => !equals(selector(_initialState), value), [value]) 

        const setValue = useCallback((update: Update<R>) => {
            setFieldValue(selector, update)
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
            wasModified
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
        isSubmitting.setState(true)
        onSubmit({
            state: store.getState(),
            errors: getErrors(),
            touchedFields: touchedStore.getState()
        }).finally(() => isSubmitting.setState(false))
    }

    return {
        useField,
        setFieldValue,
        Field,
        getErrors,
        wasModified,
        reinitialize,
        reset,
        useIsSubmitting,
        isSubmitting: isSubmitting.getState,
        getTouchedFields: touchedStore.getState,
        setTouchedFields: touchedStore.setState,
        getState: store.getState,
        setState: store.setState,
        subscribe: subscribeExternal,
        submit
    }
}
