type GatewayResult = {
  clientCorrelator?: string;
  ecocashReference?: string;
  responseCode?: string | null;
  transactionOperationStatus?: string;
  ecocashResponseCode?: string;
};

/** Only definitive outcomes release a pending attempt. Unknown responses remain pending. */
export function classifyOutcome(httpStatus: number, result: GatewayResult, id: string, action: 'start' | 'check') {
  const ok = httpStatus >= 200 && httpStatus < 300;
  const matching = result.clientCorrelator === id;
  const charged = ok && matching && typeof result.ecocashReference === 'string' &&
    result.ecocashReference.length > 0 &&
    ((result.responseCode === '00' && result.transactionOperationStatus === 'Charged') ||
     (result.ecocashResponseCode === 'SUCCEEDED' && result.transactionOperationStatus === 'COMPLETED'));
  const failures = ['INSUFFICIENT_FUNDS', 'INCORRECT_PIN', 'INVALID_PIN', 'LIMIT_EXCEEDED', 'FAILED', 'CANCELLED', 'CANCELED'];
  const failed = (action === 'start' && [400, 401, 403, 422].includes(httpStatus)) ||
    (ok && matching && failures.includes(result.ecocashResponseCode ?? ''));
  return charged ? 'charged' : failed ? 'failed' : 'pending';
}

export function explainFailure(httpStatus: number, code: unknown, message: unknown): string {
  const byCode: Record<string, string> = {
    INSUFFICIENT_FUNDS: 'The sandbox reported insufficient funds.',
    INCORRECT_PIN: 'The sandbox reported an incorrect PIN.',
    INVALID_PIN: 'The sandbox reported an incorrect PIN.',
    LIMIT_EXCEEDED: 'The sandbox transaction limit was exceeded.',
    CANCELLED: 'The sandbox payment was cancelled.',
    CANCELED: 'The sandbox payment was cancelled.',
  };
  const observedMessages: Record<string, string> = {
    'You have insufficient funds to complete this transaction.': 'The sandbox reported insufficient funds.',
    'Invalid PIN.': 'The sandbox reported an incorrect PIN.',
    'Transaction limit exceeded.': 'The sandbox transaction limit was exceeded.',
  };
  if (typeof code === 'string' && byCode[code]) return byCode[code];
  // These messages were observed with a definitive FAILED status in the sandbox.
  if (code === 'FAILED' && typeof message === 'string' && observedMessages[message]) return observedMessages[message];
  if (httpStatus === 401 || httpStatus === 403) return 'EcoCash rejected the sandbox credentials.';
  if (httpStatus === 400) return 'EcoCash rejected the sandbox request details.';
  return 'EcoCash declined the sandbox payment.';
}
