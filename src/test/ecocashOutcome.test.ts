import { describe, expect, it } from 'vitest';
import { classifyOutcome, explainFailure } from '../../supabase/functions/ecocash-sandbox/outcome';

describe('EcoCash sandbox outcomes', () => {
  const id = 'test-reference';
  it('accepts both documented and observed success formats only with the matching reference', () => {
    expect(classifyOutcome(200, { clientCorrelator: id, ecocashReference: 'eco-1', responseCode: '00', transactionOperationStatus: 'Charged' }, id, 'check')).toBe('charged');
    expect(classifyOutcome(200, { clientCorrelator: id, ecocashReference: 'eco-1', ecocashResponseCode: 'SUCCEEDED', transactionOperationStatus: 'COMPLETED' }, id, 'check')).toBe('charged');
    expect(classifyOutcome(200, { clientCorrelator: 'other', ecocashReference: 'eco-1', ecocashResponseCode: 'SUCCEEDED', transactionOperationStatus: 'COMPLETED' }, id, 'check')).toBe('pending');
    expect(classifyOutcome(200, { clientCorrelator: id, ecocashResponseCode: 'SUCCEEDED', transactionOperationStatus: 'COMPLETED' }, id, 'check')).toBe('pending');
  });
  it.each(['INSUFFICIENT_FUNDS', 'INVALID_PIN', 'LIMIT_EXCEEDED'])('recognizes %s as a failure', code => {
    expect(classifyOutcome(200, { clientCorrelator: id, ecocashResponseCode: code }, id, 'check')).toBe('failed');
  });
  it('recognizes the FAILED status returned by the real sandbox lookups', () => {
    expect(classifyOutcome(200, { clientCorrelator: id, ecocashReference: 'eco-1', ecocashResponseCode: 'FAILED', transactionOperationStatus: 'FAILED', responseCode: null }, id, 'check')).toBe('failed');
  });
  it('keeps uncertain or failed lookups pending rather than retrying a charge', () => {
    expect(classifyOutcome(200, { clientCorrelator: id, ecocashResponseCode: 'PENDING_SUBSCRIBER_VALIDATION' }, id, 'check')).toBe('pending');
    expect(classifyOutcome(404, {}, id, 'check')).toBe('pending');
    expect(classifyOutcome(500, {}, id, 'start')).toBe('pending');
    expect(classifyOutcome(401, {}, id, 'start')).toBe('failed');
  });
  it('explains known sandbox refusals without exposing arbitrary gateway messages', () => {
    expect(explainFailure(200, 'FAILED', 'You have insufficient funds to complete this transaction.')).toMatch(/insufficient funds/);
    expect(explainFailure(200, 'FAILED', 'Invalid PIN.')).toMatch(/incorrect PIN/);
    expect(explainFailure(200, 'FAILED', 'Transaction limit exceeded.')).toMatch(/limit was exceeded/);
    expect(explainFailure(200, 'FAILED', 'unexpected confidential text')).toBe('EcoCash declined the sandbox payment.');
  });
});
