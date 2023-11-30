# @gapu/formful

### example usage
```ts
export const { submit, Field, useField, getState, getErrors, subscribe } = createForm({
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
  onSubmit(props) {
    console.log(props)
  },
})
```
