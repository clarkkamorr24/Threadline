import 'server-only';
import type { z } from 'zod';
import { toPublicError } from '@/lib/errors';
import type { FieldIssue } from '@/lib/errors';
import { actionFailure, actionSuccess } from '@/types/actionResult';
import type { ActionResult } from '@/types/actionResult';

/**
 * Wraps a Server Action body so that:
 *  - input is validated against a Zod schema on the server, independently of
 *    any client-side validation, which can always be bypassed;
 *  - thrown `AppError`s become typed failures;
 *  - unexpected errors are logged and replaced with a generic message.
 *
 * This removes the repeated try/catch + parse block from every action.
 */
export function createAction<TInput, TOutput>(
  name: string,
  schema: z.ZodType<TInput>,
  handler: (input: TInput) => Promise<TOutput>,
): (rawInput: unknown) => Promise<ActionResult<TOutput>> {
  return async (rawInput: unknown): Promise<ActionResult<TOutput>> => {
    const parsed = schema.safeParse(rawInput);

    if (!parsed.success) {
      return actionFailure({
        code: 'VALIDATION_ERROR',
        message: 'Please correct the highlighted fields.',
        issues: toFieldIssues(parsed.error),
      });
    }

    try {
      return actionSuccess(await handler(parsed.data));
    } catch (error) {
      const appError = toPublicError(error, name);
      return actionFailure({
        code: appError.code,
        message: appError.message,
        issues: appError.issues,
      });
    }
  };
}

export function toFieldIssues(error: z.ZodError): readonly FieldIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}
