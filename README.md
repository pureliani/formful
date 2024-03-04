## @gapu/formful - A fully type-safe form manager for react.js

### Install
```bash
$ npm i @gapu/formful
```

### Example - createForm
```ts
import { createForm } from '@gapu/formful';
import { z } from 'zod';

const {
  useField,
  Field,
  focus,
  getState,
  setState,
  getMetaState,
  setMetaState,
  setFieldValue,
  getErrors,
  isSubmitting,
  useIsSubmitting,
  subscribe,
  submit,
} = createForm({
  storageKey: "abc",
  schema: z.object({
    a: z.object({
      b: z.object({
        c: z.string()
      })
    }),
    d: z.object({
      e: z.object({
        f: z.string()
      })
    }),
    numbers: z.array(z.number()),
    focusable: z.string()
  }),
  initialState: {
    a: {b: {c: ""}},
    d: {e: {f: ""}},
    numbers: [],
    focusable: ""
  },
  async onSubmit({ state, errors }) {
    console.log({ state, errors });
  },
});
```

### Example - useField
```tsx
const FieldC = () => {
  const { 
    value,
    setValue,
    errors,
    meta,
    setMeta, 
    focus 
  } = useField(state => state.a.b.c)
  return (
    <div>
      ...
    </div>
  );
};
```

### Example - Field
```tsx
const FieldF = () => {
  return (
    <Field selector={state => state.d.e.f}>
      {({ 
        value,
        setValue,
        errors,
        meta,
        setMeta, 
        focus 
      }) => (
        <div>
          ...
        </div>
      )}
    </Field>
  );
}
```

### Example - Arrays
> [!CAUTION]
> When mapping over an array, make sure to use the index as a key!

```tsx
const NumberListItem = ({ index }: { index: number }) => {
  return (
    <Field selector={state => state.numbers[index]}>
      {({ 
        value,
        setValue,
        errors,
        meta,
        setMeta, 
        focus 
      }) => (
        <li>
          <input type="text"
           value={value} 
           onChange={e => {
              if(/^\d+(\.\d+)?$/.test(e.target.value)) {
                setValue(Number(e.target.value))
              } else {
                setValue(e.target.value as unknown as number)
              }
           }} 
           onBlur={() => setMeta({touched: true})}
          />
          <button onClick={() => {
            setFieldValue(
              state => state.numbers, 
              prev => prev.filter((_, i) => i !== index)
            )
          }}>
            Delete
          </button>
          {meta?.touched && errors.length > 0 && (
            <label style={{ color: 'crimson' }}>{errors}</label>
          )}
        </li>
      )}
    </Field>
  )
}

const NumberList = () => {
  return (
    <Field selector={state => state.numbers} >
      {({ value, setValue }) => (
        <div>
          <ul>
            {value.map((_, index) => (
              <NumberListItem 
                key={index} // THIS IS IMPORTANT!
                index={index}
              />
            ))}
          </ul>
          <button onClick={() => setValue(prev => [...prev, 0])}>+ ADD</button>
        </div>
      )}
    </Field>
  );
}
```

### Example - useIsSubmitting
A hook which indicates if the form is currently being submitted 

```tsx 
const { useIsSubmitting } = createForm({ ... });
```

### Example - storageKey
An optional parameter of createForm which will be used to persist the form state in localStorage

```tsx 
const { ... } = createForm({ 
  storageKey: "some-local-storage-key", 
  ... 
});
```

### Example - submit
Calls the onSubmit callback with values, errors and touchedFields.
( onSubmit will be invoked even if the form is invalid, you should check for errors inside onSubmit )

```tsx 
const { submit } = createForm({ ... });
// usage
submit()
```

### Example - setState
```tsx
const { setState } = createForm({ ... });

// usage
setState({
  username: "pureliani",
  email: "invalid@gmailcom",
  contactPhones: [""]
})
// or
setState((prevState) => ({
  username: "pureliani",
  email: "valid@gmail.com",
  contactPhones: [...prevState.contactPhones, ""]
}))
```

### Example - setFieldValue
```tsx
const { setFieldValue } = createForm({ ... });

// usage
setFieldValue(state => state.email, "example@gmail.com")
// or
setFieldValue(state => state.email, prevValue => prevValue + "something")
```

### Example - getState
```tsx
const { getState } = createForm({ ... });

// usage
const state = getState()
// {
//   username: "",
//   email: "example@gmail.comsomething",
//   contactPhones: [""]
// }  
```

### Example - getErrors
> [!TIP]
> `errors` will be null when the form is completely valid

```tsx
const { getErrors } = createForm({ ... });

// usage
const errors = getErrors()
// z.ZodError | null
```

### Example - setMetaState
```tsx
const { setMetaState } = createForm({ ... });

// usage
setMetaState({
  "a.b.c": {
    touched: false,
    dirty: false,
    disabled: false,
    visible: false,
    loading: false,
    required: false,
  },
   "d.e.f": {
    touched: false,
    dirty: false,
    disabled: false,
    visible: false,
    loading: false,
    required: false,
  },
  ...
})
// or
setTouchedFields(prev => ({
  ...prev,
    "a.b.c": {
    touched: false,
    dirty: false,
    disabled: false,
    visible: false,
    loading: false,
    required: false,
  },
   "d.e.f": {
    touched: false,
    dirty: false,
    disabled: false,
    visible: false,
    loading: false,
    required: false,
  },
}))
```

### Example - getMetaState
```tsx
const { getMetaState } = createForm({ ... });

// usage
const metaState = getTouchedFields()
console.log(metaState['a.b.c'])
console.log(metaState['d.e.f'])
```

### Example - subscribe
```tsx
const { subscribe } = createForm({ ... });

// usage
const unsubscribe = subscribe(({ state, errors, touchedFields }) => {
  console.log("state", state)
  console.log("errors", errors)
  console.log("touchedFields", touchedFields)
})
// later...
unsubscribe()
```


### Example - focus
> [!NOTE]
> for this to work, `onFocus` should be passed to the useField as shown in example. 

```tsx
const Focusable = () => {
  const ref = useRef<HTMLInputElement | null>(null)
  const { value, setValue } = useField(state => state.focusable, {
    onFocus() {
      ref.current?.focus()
    },
  })

  return (
    <input 
      type="text" 
      ref={ref} 
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
}

const SomeOtherComponent = () => {
  ...
  const onFocusFocusable = () => {
    focus(state => state.focusable)
  }
  ...
}
```
