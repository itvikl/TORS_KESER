/** Red asterisk for a field the form can't be saved (or the tour published) without; screen readers get the words. */
export default function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ms-0.5 text-terracotta">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </>
  );
}
