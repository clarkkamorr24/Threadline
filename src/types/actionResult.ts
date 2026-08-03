import type { ErrorCode, FieldIssue } from '@/lib/errors';

export interface ActionError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly issues: readonly FieldIssue[];
}

export type ActionResult<TData> =
  | { readonly success: true; readonly data: TData }
  | { readonly success: false; readonly error: ActionError };

export function actionSuccess<TData>(data: TData): ActionResult<TData> {
  return { success: true, data };
}

export function actionFailure<TData = never>(error: ActionError): ActionResult<TData> {
  return { success: false, error };
}
