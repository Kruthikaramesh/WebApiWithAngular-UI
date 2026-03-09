import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { ProblemDetails, ValidationProblemDetails } from '../models/problem-details.model';
import { AppHttpError } from '../models/app-http-error.model';


/**
 * Global HTTP error interceptor.
 *
 * - Centralizes error handling, using RxJS CatchError interceptor.
 * - Normalizes API errors into a consistent structure
 * - Handles RFC 7807 ProblemDetails responses.
 * - Surface Validation Errors
 * - Categorizes Authentication / Authorization failures
 * - Detects Concurrency conflicts
 * - Ensures that Components receive a normalized AppHttpError.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {

    return next(req).pipe(

        catchError((error: HttpErrorResponse) => {

            // --- log the error for debugging purposes.  In production, consider logging to an external service.
            // console.log('GLOBAL HTTP ERROR:', error);
            // console.log('GLOBAL ERROR BODY:', error.error);

            // Extract RFC7807 ProblemDetails payload (if present)
            const problem = error.error as ProblemDetails | null;

            const appError: AppHttpError = {
                status: error.status,
                title: problem?.title ?? 'Server Error',
                detail: problem?.detail ?? 'Unexpected server error occurred.'
            };

            // (400) Validation errors 
            if (problem && error.status === 400) {

                const validation = problem as ValidationProblemDetails;

                if (validation.errors) {
                    appError.validationErrors = validation.errors;
                    console.warn('Validation errors:', validation.errors);
                }
            }

            // (409) Conflict - like Duplicate entry.
            if (error.status === 409) {
                console.warn('Conflict detected:', problem?.detail);
            }

            // (412) Optimistic Concurrency Conflict detected due to RowVersion mismatch.
            if (error.status === 412) {
                appError.isConcurrencyError = true;
                console.warn('Concurrency conflict detected:', problem?.detail);
            }

            // (401) Unauthorized
            if (error.status === 401) {
                appError.isUnauthorized = true;
                console.warn('Unauthorized access.');
            }

            // (403) Forbidden
            if (error.status === 403) {
                appError.isForbidden = true;
                console.warn('Unauthenticated access.  Access is forbidden');
            }

            // Return the normalized error to the component.
            return throwError(() => appError);
        })
    );

};
