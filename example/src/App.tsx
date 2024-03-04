/* eslint-disable @typescript-eslint/no-unused-vars */
import { createForm } from '@gapu/formful';
import { useRef } from 'react';
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

const FieldC = () => {
  const { value, setValue, errors, meta, setMeta, focus } = useField(state => state.a.b.c)
  return (
    <div>
      <label>Field C </label>
      <input
        type="text"
        value={value ?? 0}
        onBlur={() => setMeta({
          touched: true
        })}
        onChange={(e) => setValue(e.target.value)}
      />
      <br />
      {meta?.touched && errors.length > 0 && (
        <label style={{ color: 'crimson' }}>{errors}</label>
      )}
    </div>
  );
};

const FieldF = () => {
  const { value, setValue, errors, meta, setMeta, focus } = useField(state => state.d.e.f)
  return (
    <div>
      <label>Field F </label>
      <input
        type="text"
        value={value ?? 0}
        onBlur={() => setMeta({
          touched: true
        })}
        onChange={(e) => setValue(e.target.value)}
      />
      <br />
      {meta?.touched && errors.length > 0 && (
        <label style={{ color: 'crimson' }}>{errors}</label>
      )}
    </div>
  );
};


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

const Focusable = () => {
  const ref = useRef<HTMLInputElement | null>(null)
  const { value, setValue } = useField(state=> state.focusable, {
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

setTimeout(() => {
  focus(state => state.focusable)
})

export const App = () => {

  return (
    <div>
      <FieldC />
      <br />
      <FieldF />
      <br />
      <Focusable />
      <br />
      <NumberList />
      <button onClick={submit}>
        Submit
      </button>
    </div>
  );
};
