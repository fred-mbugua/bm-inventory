// Defining a custom error class that extends the built-in Error class
export class CustomError extends Error {
  // Property for storing the HTTP status code associated with the error
  statusCode: number;
  // Property to indicate if the error is operational (expected)
  isOperational: boolean;

  // Constructor for the CustomError class
  constructor(message: string, statusCode: number, isOperational = true, stack = '') {
    // Calling the constructor of the parent Error class
    super(message);
    // Assigning the provided status code
    this.statusCode = statusCode;
    // Assigning the operational status
    this.isOperational = isOperational;
    // Setting the name of the error class
    this.name = this.constructor.name;

    // Capturing the stack trace if not provided
    if (stack) {
      this.stack = stack;
    } else {
      // Capturing stack trace for better debugging
      Error.captureStackTrace(this, this.constructor);
    }
  }
}