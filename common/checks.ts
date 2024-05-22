import { ethers } from 'ethers';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

export function checkIfNumber(
  value: string | undefined,
  errorMessage = `${value} is not a number`,
) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) {
    // throw new HttpApplicationError(errorMessage, { statusCode: 404 });
    throw new ApiError(errorMessage, 404);
  }
  return numberValue;
}

export function checkIfAddress(
  value: string | undefined,
  errorMessage = `${value} is not a address`,
) {
  if (typeof value !== 'string' || !ethers.isAddress(value)) {
    throw new ApiError(errorMessage, 404);
  }
  return value;
}

export function isExists(value: string) {
  return !!value;
}

export function isEmpty(value: string) {
  return !value;
}
