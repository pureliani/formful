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
  submit,
  setState,
  setFieldValue,
  getState,
  getErrors,
  getTouchedFields,
  setTouchedFields,
  subscribe,
} = createForm({
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
  const { value, setValue, errors, isTouched, setIsTouched } = useField(state => state.username)

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
      {({ value, setValue, errors, isTouched, setIsTouched }) => (
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
              setFieldValue(state => state.contactPhones, prev => prev.filter(v => v !== value))
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

### Example - submit
> [!NOTE]
> `submit` function is returned from the "createForm" call

```tsx
export const App = () => {
  return (
    <div>
      <UsernameField />
      <br />
      <EmailField />
      <br />
      <ContactPhones />
      <br />
      <button onClick={submit}>
        Submit
      </button>
    </div>
  );
};
```

### Example - setState
```tsx
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
setFieldValue(state => state.email, "example@gmail.com")
// or
setFieldValue(state => state.email, prevValue => prevValue + "something")
```

### Example - getState
```tsx
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
const errors = getErrors()
// z.ZodError | null
```

### Example - setTouchedFields
> [!TIP]
> if you'd like to set some deeply nested field to touched, you would use "dot chain" syntax e.g:
> ["a.b.0.c"]

```tsx
setTouchedFields(["email", "username", "contactPhones.0"])
// or
setTouchedFields(prev => [...prev, "email", "username", "contactPhones.0"])
```

### Example - getTouchedFields
> [!TIP]
> if the form is nested, the returned value will be an array of "dot chained" strings, e.g:
> ["a.b.0.c"]

```tsx
const touchedFields = getTouchedFields()
// ["email", "username", "contactPhones.0"]
```

### Example - subscribe
```tsx
const unsubscribe = subscribe(({ state, errors, touchedFields }) => {
  console.log("state", state)
  console.log("errors", errors)
  console.log("touchedFields", touchedFields)
})
// later...
unsubscribe()
```
