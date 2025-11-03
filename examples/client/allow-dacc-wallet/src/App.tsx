import { useState } from 'react';
import { allowDaccWallet } from 'dacc-js';
import './App.css';

function App() {
  const [password, setPassword] = useState('');
  const [encryptedKey, setEncryptedKey] = useState('');
  const [wallet, setWallet] = useState<{
    address?: string;
    privateKey?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAllowWallet = async () => {
    try {
      setError(null);
      setWallet(null);

      if (!password) {
        setError('⚠️ Please enter your password.');
        return;
      }

      if (!encryptedKey) {
        setError('⚠️ Please enter your encryptedPublickey or address.');
        return;
      }

      setLoading(true);

      const allowResult = await allowDaccWallet({
        daccPublickey: encryptedKey,
        passwordSecretkey: password,
      });

      setWallet(allowResult);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Allow wallet error:', err);
      setError(err.message || 'An error occurred while accessing the wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>allowDaccWallet</h1>

      <div className="form">
        <label htmlFor="encryptedKey">🧩 Encrypted Public Key:</label>
        <textarea
          id="encryptedKey"
          placeholder="Paste your daccPublickey_XXX..."
          value={encryptedKey}
          onChange={(e) => setEncryptedKey(e.target.value)}
          disabled={loading}
          rows={4}
        />

        <label htmlFor="password">🔑 Password:</label>
        <input
          id="password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button onClick={handleAllowWallet} disabled={loading}>
          {loading ? '⏳ Decrypting...' : 'Access Wallet'}
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {wallet && (
        <div className="result">
          <h3>🎉 Wallet Access Granted!</h3>
          <p>
            <strong>Address:</strong> {wallet.address}
          </p>
          <p>
            <strong>Private Key:</strong>
          </p>
          <textarea readOnly value={wallet.privateKey} rows={3}></textarea>
        </div>
      )}
    </div>
  );
}

export default App;
