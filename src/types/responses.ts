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
export type Response<T> =
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      data: T;
    }; 