'use client'

import * as React from 'react'
import { cn } from 'cn'

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    // asinko: a generic wrapper; the control comes with htmlFor (or as a child) through props.
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- associated by its caller
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
