// An error whose user-facing text is a translation key (see src/i18n), so it is shown in the
// language selected at display time rather than the one active when it was thrown.
export class AppError extends Error {
  constructor(key, params) {
    super(key)
    this.name = 'AppError'
    this.key = key
    this.params = params
  }
}
