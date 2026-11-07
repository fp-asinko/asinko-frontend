import type { ComponentType } from 'react'

/**
 * A deferred component that fades in where its skeleton was (specs/content-reveal CR-01): for the
 * `then` of a `next/dynamic` import, `dynamic(() => import('./x').then((m) => arriving(m.X)))`.
 * Its wrapper has no box (`arrive`): the layout does not change.
 */
export function arriving<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  function Arriving(props: P) {
    return (
      <div className="arrive">
        <Component {...props} />
      </div>
    )
  }
  return Arriving
}
