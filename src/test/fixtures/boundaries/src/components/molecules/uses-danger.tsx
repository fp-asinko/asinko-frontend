// VIOLATION react/no-danger.
export function UsesDanger({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
