export class CustomError extends Error {
    /**
     * @param {string} origin - Service the error originated from
     * @param {string} details - Optional additional data (e.g., original error)
     * @param {string} message - Human-readable error message (inherited from Error) **abstracted from clients**
     * @param {string} error - The original error description **abstracted from clients**
     * @param {string} cause - Trace stack of the error (inherited from Error) **abstracted from clients**
     * @param {number} status - HTTP status code (default: 500)
   */

    constructor({origin, details="No details provided", message, error, cause={}, status=500}) {
        super(message, {cause})
        this.origin = origin
        this.details = details
        this.error = error
        this.status = status
    }
}