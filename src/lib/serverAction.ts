import 'server-only';
import type { z } from 'zod';
import { toPublicError } from '@/lib/errors';
import type { FieldIssue } from '@/lib/errors';
import { actionFailure, actionSuccess } from '@/types/actionResult';
import type { ActionResult } from '@/types/actionResult';

export function createAction<TSchema extends z.ZodTypeAny, TOutput>(
  name: string,
  schema: TSchema,
  handler: (input: z.output<TSchema>) => Promise<TOutput>,
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
