## @gapu/formful - A fully type-safe form manager for react.js

### Install
```bash
$ npm i @gapu/formful
```

### example: createForm
```ts
import { createForm } from '@gapu/formful';
import { z } from 'zod';

const { 
  submit, 
  Field, 
  useField, 
  getErrors, 
  getState, 
  setState, 
  getTouchedFields, 
  setTouchedFields, 
  subscribe 
} = createForm({
    schema: z.object({
      a: z.object({
        b: z.object({
          c: z.number().min(2).nullable(),
        }),
      }),
      d: z.object({
        e: z.object({
          f: z.string().min(2),
        }),
      }),
    }),
    initialState: {
      a: {
        b: {
          c: 0,
        },
      },
      d: {
        e: {
          f: '',
        },
      },
    },
    async onSubmit({ state, errors, touchedFields }) {
      console.log({ state, errors, touchedFields });
    },
  });
```

### example: useField
```tsx
const InputC = () => {
  const { value, setValue, errors, isTouched, setIsTouched } = useField(state => state.a.b.c)

  return (
    <div>
      <span>F: </span>
      <input
        type="text"
        value={value ?? 0}
        onBlur={() => setIsTouched(true)}
        onChange={(e) => {
          const asNumber = Number(e.target.value)
          if (isNaN(asNumber)) {
            alert("Input was not a number")
          }
          setValue(asNumber)
        }}
      />
      {isTouched && errors.length > 0 && (
        <h3 style={{ color: 'crimson' }}>Errors for C: {errors}</h3>
      )}
    </div>
  );
}
```

### example: Field
```tsx
const InputF = () => {
  return (
    <Field selector={state => state.d.e.f}>
      {({ value, setValue, errors, isTouched, setIsTouched }) => (
        <div>
          <span>F: </span>
          <input
            type="text"
            value={value ?? 0}
            onBlur={() => setIsTouched(true)}
            onChange={(e) => setValue(e.target.value)}
          />
          {isTouched && errors.length > 0 && (
            <h3 style={{ color: 'crimson' }}>Errors for F: {errors}</h3>
          )}
        </div>
      )}
    </Field>
  );
}
```

### example: subscribe
```tsx
const unsubscribe = subscribe(({ state, errors, touchedFields }) => {
  console.log("State has changed: ", state)
  console.log("Errors in the new state: ", errors)
})
```
