import { ZodError, z } from "zod"
import { type ReactNode, memo, useCallback, useMemo } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim"

export type OnSubmitProps<State> = {
    data: State
    errors: ZodError<State> | null
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
export type Subscriber = () => void
export type ExternalSubscriberProps<S> = {
    state: S,
    errors: z.ZodError<S> | null
}
export type ExternalSubscriber<S> = (props: ExternalSubscriberProps<S>) => void

export type Paths<T> = T extends object ? { [K in keyof T]:
    `${Exclude<K, symbol>}${"" | `.${Paths<T[K]>}`}`
}[keyof T] : never

export type DeepValue<T, Path extends string> = Path extends `${infer First}.${infer Rest}`
    ? First extends keyof T
    ? DeepValue<T[First], Rest>
    : never
    : Path extends keyof T
    ? T[Path]
    : never;

const setNestedValue = <T,>(obj: T, path: string[], update: Update<any>): T => {
    if (path.length === 0) {
        return update(obj);
    }
    const [head, ...tail] = path;
    return {
        ...obj,
        [head]: setNestedValue((obj as any)[head], tail, update),
    };
}

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

const createStore = <
    Schema extends z.ZodTypeAny,
    State extends z.infer<Schema>
>({ initialState, schema }: CreateStoreProps<State, Schema>) => {
    let state = initialState;
    const parsed = schema.safeParse(initialState)
    let errors: z.ZodError<State> | null = parsed.success ? null : parsed.error

    const getState = () => state;
    const getErrors = () => errors;
    const subscribers = new Set<Subscriber>();
    const externalSubscribers = new Set<ExternalSubscriber<State>>();
    type Update = (prev: State) => State
    const setState = (update: Update) => {
        state = update(state)
        const parsed = schema.safeParse(state)
        errors = parsed.success ? null : parsed.error
        subscribers.forEach((l) => l());
        externalSubscribers.forEach(s => (
            s({ state, errors })
        ))
    };
    const subscribe = (s: Subscriber) => {
        subscribers.add(s);
        return () => subscribers.delete(s);
    };
    const subscribeExternal = (s: ExternalSubscriber<State>) => {
        externalSubscribers.add(s)
        return () => {
            externalSubscribers.delete(s)
        }
    }
    return { getState, getErrors, setState, subscribe, subscribeExternal };
};

const typedMemo: <T>(c: T) => T = memo;

export const createForm = <
    Schema extends z.ZodTypeAny,
    State extends z.infer<Schema>
>({
    schema,
    onSubmit,
    initialState
}: CreateFormProps<State, Schema>) => {
    type FuzzyState = z.infer<Schema>
    const store = createStore({ initialState, schema })

    const getErrorForPath = (errors: ZodError<State> | null, path: string[]): string[] => {
        if (!errors || path.length === 0) return [];

        const matchingErrors = errors.errors.filter(error =>
            error.path.length >= path.length &&
            path.every((segment, index) => error.path[index] === segment)
        );

        return matchingErrors.map(error => error.message);
    };

    const useField = <N extends Paths<State>>(name: N) => {
        const path = useMemo(() => name.split("."), [name])
        const errors = getErrorForPath(store.getErrors(), path);
        const getSnap = useCallback(() => getNestedValue(store.getState(), path) as DeepValue<FuzzyState, N>, [path])
        const value = useSyncExternalStore(store.subscribe, getSnap, getSnap)

        const setValue = (update: Update<DeepValue<FuzzyState, N>>) => {
            store.setState((prevState) => setNestedValue(prevState, path, update instanceof Function ? update : () => update));
        }

        return {
            errors,
            setValue,
            value
        }
    }

    type FieldProps<N extends Paths<State>> = {
        name: N
        children: (props: ReturnType<typeof useField<N>>) => ReactNode
    }
    const Field = typedMemo(<N extends Paths<State>>({ name, children }: FieldProps<N>) => {
        const props = useField(name)
        return children(props)
    })

    const submit = () => {
        onSubmit({
            data: store.getState(),
            errors: store.getErrors()
        })
    }

    return {
        useField,
        Field,
        getErrors: store.getErrors,
        getState: store.getState,
        subscribe: store.subscribeExternal,
        submit
    }
}