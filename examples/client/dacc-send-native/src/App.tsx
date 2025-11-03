import { useState } from 'react';
import { daccSendNative } from 'dacc-js';
import { optimismSepolia } from 'viem/chains';
import './App.css';

function App() {
  const [daccPublickey, setdaccPublickey] = useState('');
  const [password, setPassword] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [txResult, setTxResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendNative = async () => {
    if (!daccPublickey || !password || !recipient || !amount) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const tx = await daccSendNative({
        daccPublickey: daccPublickey,
        passwordSecretkey: password,
        network: optimismSepolia,
        to: recipient as `0x${string}`,
        amount: amount,
      });

      setTxResult(tx);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Send transaction error:', err);
      setError(err.message || 'Failed to send transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Send Native (daccSendNative)</h1>
      <h2>
        on <b>Optimism Sepolia</b> Network
      </h2>

      <div className="form">
        <label>Encrypted Public Key:</label>
        <textarea
          value={daccPublickey}
          onChange={(e) => setdaccPublickey(e.target.value)}
          rows={4}
          placeholder="daccPublickey_..."
          disabled={loading}
        />

        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <label>Recipient Address:</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={loading}
        />

        <label>Amount (ETH):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          step={0.000001}
          disabled={loading}
        />

        <button onClick={handleSendNative} disabled={loading}>
          {loading ? '⏳ Sending...' : 'Send Native'}
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {txResult && (
        <div className="tx-result">
          <h3>✅ Transaction Sent!</h3>
          <p>
            <strong>From:</strong> {txResult.from}
          </p>
          <p>
            <strong>To:</strong> {txResult.to}
          </p>
          <p>
            <strong>Amount:</strong> {txResult.amount}
          </p>
          <p>
            <strong>Tx Hash:</strong> {txResult.txHash}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
