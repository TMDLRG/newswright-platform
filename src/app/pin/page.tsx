'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

export default function PinPage() {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  async function submitPin(pin: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        // Hard redirect so the browser sends the new cookie with the request
        window.location.href = '/';
      } else {
        setError('Invalid PIN. Please try again.');
        setDigits(['', '', '', '', '', '']);
        setLoading(false);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const pin = newDigits.join('');
      if (pin.length === 6) {
        submitPin(pin);
      }
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);

    if (pasted.length === 6) {
      submitPin(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="text-3xl font-bold text-slate-800 tracking-tight">
            NEWS<span className="text-blue-600">WRIGHT</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
            Investor Package Platform
          </div>
        </div>

        {/* PIN Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-center text-sm font-semibold text-slate-600 mb-6">
            Enter Access PIN
          </h2>

          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2.5 mb-6">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={loading}
                className={`w-11 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all outline-none
                  ${error
                    ? 'border-red-300 text-red-600 bg-red-50'
                    : digit
                      ? 'border-blue-400 text-slate-800 bg-blue-50'
                      : 'border-slate-200 text-slate-800 bg-slate-50'
                  }
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-4">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Verifying...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center text-sm text-red-500 mb-4">
              {error}
            </div>
          )}

          {/* Help Text */}
          <p className="text-center text-xs text-slate-400">
            Contact your investment partner for access credentials.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[10px] text-slate-300">
          NewsWright &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
