export class CustomError extends Error {
    /**
     * @param {number} status - HTTP status code (default: 500)
     * @param {string} message - Human-readable error message
     * @param {any} details - Optional additional data (e.g., original error)
   */

    constructor({status = 500, message, details="No details provided", source}) {
        super(message)
        this.name = "CustomError"
        this.status = status
        this.message = message
        this.details = details
        this.source = source
    }
}