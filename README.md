## @gapu/formful - A fully type-safe form manager for react.js

### example usage
```ts
import { createForm } from '@gapu/formful'
import { z } from 'zod'

const { 
  submit,
  Field,
  useField,
  getState,
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
