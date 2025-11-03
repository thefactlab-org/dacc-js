import { useState } from 'react';
import { daccSendToken } from 'dacc-js';
import { optimismSepolia } from 'viem/chains';
import './App.css';

function App() {
  const [daccPublickey, setDaccPublickey] = useState('');
  const [password, setPassword] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(0);
  const [decimals, setDecimals] = useState<number>(18);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tx, setTx] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await daccSendToken({
        daccPublickey,
        passwordSecretkey: password,
        network: optimismSepolia,
        tokenAddress: tokenAddress as `0x${string}`,
        to: recipient as `0x${string}`,
        amount,
        decimals,
      });

      setTx(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error sending token:', err);
      setError(err.message || 'Failed to send token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Send Token (daccSendToken)</h1>
      <h2>
        on <b>Optimism Sepolia</b> Network
      </h2>

      <div className="form">
        <label>Encrypted Public Key:</label>
        <textarea
          value={daccPublickey}
          onChange={(e) => setDaccPublickey(e.target.value)}
          rows={4}
          disabled={loading}
        />

        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <label>Token Contract Address:</label>
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          disabled={loading}
        />

        <label>Recipient Address:</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={loading}
        />

        <label>Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          step="0.01"
          disabled={loading}
        />

        <label>Decimals (optional):</label>
        <input
          type="number"
          value={decimals}
          onChange={(e) => setDecimals(Number(e.target.value))}
          step={1}
          placeholder="18"
          disabled={loading}
        />

        <button onClick={handleSendToken} disabled={loading}>
          {loading ? '⏳ Sending...' : 'Send Token'}
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {tx && (
        <div className="tx-result">
          <h3>✅ Transaction Successful</h3>
          <p>
            <strong>Tx Hash:</strong> {tx.txHash}
          </p>
          <p>
            <strong>From:</strong> {tx.from}
          </p>
          <p>
            <strong>To:</strong> {tx.to}
          </p>
          <p>
            <strong>Token:</strong> {tx.tokenAddress}
          </p>
          <p>
            <strong>Amount:</strong> {tx.amount}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
