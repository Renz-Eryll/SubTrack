// An Error the error middleware turns into a JSON response with this status code.
export const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
