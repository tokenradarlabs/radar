import { IUserProfile } from './user';

/**
 * Type for API results with success/error status
 */
export type Result<T> =
  | {
      success: false;
      error: string;
      status: number;
    }
  | {
      success: true;
      data: T;
    };

/**
 * Type for API responses with data/error
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type Response<T> = SuccessResponse<T> | ErrorResponse;

export interface IUserResponse extends Response<IUserProfile> {}
