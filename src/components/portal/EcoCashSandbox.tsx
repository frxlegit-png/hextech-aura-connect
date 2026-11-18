import { useState } from 'react';
import type { useSandboxPayments } from '@/hooks/useSandboxPayments';

type Props = { sandbox: ReturnType<typeof useSandboxPayments> };

/** Sandbox only: simulated payments never settle a real invoice. */
export function EcoCashSandbox({ sandbox }: Props) {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const pending = sandbox.payments.find(p => p.status === 'pending');
  return (
    <div className="hx-pay-block">
      <div className="hx-pay-label">EcoCash sandbox test</div>
      <p className="hx-modal-sub">Simulated payments update test invoices and test balances. No real money moves.</p>
      <p className="hx-modal-sub">Any amount beyond unpaid test invoices is recorded as unapplied, not as account credit.</p>
      {pending ? (
        <>
          <p role="status" className="hx-modal-sub">Test payment pending. Complete any prompt on your phone. Status updates automatically while this page is open.</p>
          <button className="hx-copy-btn" disabled={sandbox.busy} onClick={() => void sandbox.check(pending.id)}>CHECK TEST PAYMENT</button>
        </>
      ) : (
        <>
          <label>EcoCash test number
            <input className="w-full rounded border bg-background p-2 text-foreground" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0771234567" inputMode="tel" />
          </label>
          <label>Test amount (USD)
            <input className="w-full rounded border bg-background p-2 text-foreground" value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0.01" max="10000" step="0.01" />
          </label>
          <button className="hx-copy-btn" disabled={sandbox.busy || !sandbox.ready || !phone || !amount} onClick={() => void sandbox.start(phone, Number(amount))}>START TEST PAYMENT</button>
        </>
      )}
      {sandbox.error && <p role="alert" className="hx-modal-sub">{sandbox.error}</p>}
      {!sandbox.ready && !sandbox.error && <p className="hx-modal-sub">Loading test payment status…</p>}
    </div>
  );
}
