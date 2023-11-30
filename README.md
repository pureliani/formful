## @gapu/formful - A fully type-safe form manager for react.js

### example: createForm
```ts
import { createForm } from '@gapu/formful'
import { z } from 'zod'

const { 
  submit,
  Field,
  useField,
  getState,
  setState,
  getErrors,
  subscribe
} = createForm({
  schema: z.object({
    a: z.object({
      b: z.object({
        c: z.number().nullable()
      })
    }),
    d: z.object({
      e: z.object({
        f: z.string().min(2)
      })
    })
  }),
  initialState: {
    a: {
      b: {
        c: 0
      }
    },
    d: {
      e: {
        f: ""
      }
    }
  },
  onSubmit({ state, errors }) {
    console.log({ state, errors })
  },
})
```

### example: useField
```tsx
const InputF = () => {
  const { value, setValue, errors } = useField('d.e.f');
  return (
    <div>
      <span>F: </span>
      <input
        type="text"
        value={value ?? 0}
        onChange={(e) => setValue(e.target.value)}
      />
      <h3 style={{ color: 'crimson' }}>Errors for F: {errors}</h3>
    </div>
  );
}
```

### example: Field
```tsx
const InputC = () => {
  return (
    <Field name="a.b.c">
      {({ value, setValue, errors }) => (
        <div>
          <span>C: </span>
          <input
            type="text"
            value={value ?? 0}
            onChange={(e) => {
              const asNumber = Number(e.target.value);
              if (Number.isNaN(asNumber)) {
                alert('Input is not a number!');
              } else {
                setValue(asNumber);
              }
            }}
          />
          <h3 style={{ color: 'crimson' }}>Errors for C: {errors}</h3>
        </div>
      )}
    </Field>
  );
};
```

### example: subscribe
```tsx
const unsubscribe = subscribe(({ state, errors }) => {
  console.log("State has changed: ", state)
  console.log("Errors in the new state: ", errors)
})
```