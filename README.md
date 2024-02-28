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
  getErrors,
  getState,
  setState,
  getTouchedFields,
  setTouchedFields,
  setFieldValue,
  subscribe,
  submit,
  reset,
  reinitialize,
  wasModified,
} = createForm({
  storageKey: "abc",
  schema: z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email"),
    contactPhones: z.array(z.string().min(1, "Invalid contact phone"))
  }),
  initialState: {
    email: "",
    username: "",
    contactPhones: [""]
  },
  async onSubmit({ state, errors, touchedFields }) {
    console.log({ state, errors, touchedFields });
  },
});
```

### Example - useField
```tsx
const UsernameField = () => {
  const { value, setValue, errors, isTouched, setIsTouched, wasModified } = useField(state => state.username)

  return (
    <div>
      <label htmlFor='username'>Username </label>
      <br />
      <input
        id='username'
        type="text"
        value={value ?? 0}
        onBlur={() => setIsTouched(true)}
        onChange={(e) => setValue(e.target.value)}
      />
      <br />
      {isTouched && errors.length > 0 && (
        <label htmlFor='username' style={{ color: 'crimson' }}>{errors}</label>
      )}
    </div>
  );
};
```

### Example - Field
```tsx
const EmailField = () => {
  return (
    <Field selector={state => state.email}>
      {({ value, setValue, errors, isTouched, setIsTouched, wasModified }) => (
        <div>
          <label htmlFor='email'>Email </label>
          <br />
          <input
            id='email'
            type="email"
            value={value ?? 0}
            onBlur={() => setIsTouched(true)}
            onChange={(e) => setValue(e.target.value)}
          />
          <br />
          {isTouched && errors.length > 0 && (
            <label htmlFor='email' style={{ color: 'crimson' }}>{errors}</label>
          )}
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
const ContactPhone = ({ index }: { index: number }) => {
  return (
    <Field selector={state => state.contactPhones[index]}>
      {({ value, setValue, errors, isTouched, setIsTouched }) => (
        <li>
          <label htmlFor={`contactPhone-${index}`}>Phone #{index + 1} </label>
          <br />
          <input
            id={`contactPhone-${index}`}
            type="text"
            value={value ?? 0}
            onBlur={() => setIsTouched(true)}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            onClick={() => {
              setFieldValue(state => state.contactPhones, prev => [...prev, ""])
            }}>
            + ADD
          </button>
          <button
            onClick={() => {
              setFieldValue(state => state.contactPhones, prev => prev.filter((_, i) => i !== index))
            }}>
            - DELETE
          </button>
          <br />
          {isTouched && errors.length > 0 && (
            <label htmlFor='email' style={{ color: 'crimson' }}>{errors}</label>
          )}
        </li>
      )}
    </Field>
  )
}

const ContactPhones = () => {
  return (
    <Field selector={state => state.contactPhones}>
      {({ value, setValue }) => (
        <div>
          <h4>Contact phones</h4>
          <ul>
            {value.map((_, index) => (
              <ContactPhone 
                key={index} // THIS IS IMPORTANT!
                index={index}
              />
            )}
          </ul>
          <button onClick={() => setValue(prev => [...prev, ""])}>+ ADD</button>
        </div>
      )}
    </Field>
  );
}
```

### Example - storageKey
An optional parameter of createForm which will be used to persist the form state in localStorage

```tsx 
const { wasModified } = createForm({ 
  storageKey: "some-local-storage-key", 
  ... 
});
```

### Example - wasModified
A function which returns a boolean indicating whether the form has been modified as compared to the initial state

```tsx 
const { wasModified } = createForm({ ... });

// usage
console.log(wasModified())
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

### Example - setTouchedFields
> [!TIP]
> if you'd like to set some deeply nested field to touched, you would use "dot chain" syntax e.g:
> ["a.b.0.c"]

```tsx
const { setTouchedFields } = createForm({ ... });

// usage
setTouchedFields(["email", "username", "contactPhones.0"])
// or
setTouchedFields(prev => [...prev, "email", "username", "contactPhones.0"])
```

### Example - getTouchedFields
> [!TIP]
> if the form is nested, the returned value will be an array of "dot chained" strings, e.g:
> ["a.b.0.c"]

```tsx
const { setTouchedFields } = createForm({ ... });

// usage
const touchedFields = getTouchedFields()
// ["email", "username", "contactPhones.0"]
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
