import { useState } from 'react';
import { daccSignMessage } from 'dacc-js';
import { optimismSepolia } from 'viem/chains';
import './App.css';

function App() {
  const [daccPublickey, setDaccPublickey] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Hello Dacc-js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tx, setTx] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSign = async () => {
    try {
      setLoading(true);
      setError(null);
      setTx(null);

      const result = await daccSignMessage({
        daccPublickey: daccPublickey,
        passwordSecretkey: password,
        network: optimismSepolia,
        message: message,
      });

      setTx(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error signing message:', err);
      setError(err.message || 'Failed to sign message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Sign Message (daccSignMessage)</h1>

      <label>Encrypted Public Key</label>
      <textarea
        value={daccPublickey}
        onChange={(e) => setDaccPublickey(e.target.value)}
        rows={4}
      />

      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label>Message to Sign</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
      />

      <button onClick={handleSign} disabled={loading}>
        {loading ? '⏳ Signing...' : 'Sign Message'}
      </button>

      {error && <p className="error">{error}</p>}

      {tx && (
        <div className="tx-result">
          <h3>✅ Message Signed</h3>
          <p>
            <strong>From:</strong> {tx.from}
          </p>
          <p>
            <strong>Chain ID:</strong> {tx.chainId}
          </p>
          <p>
            <strong>Message:</strong> {tx.message}
          </p>
          <p>
            <strong>Signature:</strong>
            <br />
            <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {tx.signature}
            </code>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
