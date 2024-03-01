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
  useIsSubmitting,
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
    await new Promise((res)=> setTimeout(res, 1000))
    console.log({ state, errors, touchedFields });
  },
});
setTouchedFields("")
const UsernameField = () => {
  const { value, setValue, errors, wasTouched, setWasTouched, wasModified } = useField(state => state.username)
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
      Was modified: {wasModified() ? "yes" : "no"}
    </div>
  );
};

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

const ContactPhone = ({ index }: { index: number }) => {
  return (
    <Field selector={state => state.contactPhones[index]}>
      {({ value, setValue, errors, isTouched, setIsTouched }) => (
        <li>
          <label htmlFor='email'>Phone #{index + 1} </label>
          <br />
          <input
            id='email'
            type="email"
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
              setFieldValue(state => state.contactPhones, prev => prev.filter((_,i) => i !== index))
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
            {value.map((_, index) => <ContactPhone key={index} index={index} />)}
          </ul>
          <button onClick={() => setValue(prev => [...prev, ""])}>+ ADD</button>
        </div>
      )}
    </Field>
  );
}

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
      <button onClick={reset}>
        Reset
      </button>
      <button onClick={() => reinitialize({ email: "help@gmail.com", contactPhones: [], username: "bababooey" })}>
        Reinitialize
      </button>
    </div>
  );
};
