export function RequiredMark() {
  return (
    <span
      className="text-red-600 before:content-['*'] dark:text-red-500"
      aria-hidden="true"
      data-required-mark="true"
    />
  )
}
