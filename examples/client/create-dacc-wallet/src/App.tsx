import { useState } from 'react';
import { createDaccWallet } from 'dacc-js';
import './App.css';

function App() {
  const [password, setPassword] = useState('');
  const [wallet, setWallet] = useState<{
    address?: string;
    daccPublickey?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!password) {
        setError('⚠️ Please enter a password before creating a wallet.');
        setLoading(false);
        return;
      }

      const walletResult = await createDaccWallet({
        passwordSecretkey: password,
        // publicEncryption: true,
        // dataStorageNetwork: "opSepolia",
        // pkWalletForTransaction: "0xYOUR_PRIVATE_KEY_HERE",
      });

      setWallet(walletResult);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Create wallet error:', err);
      setError(err.message || 'An error occurred while creating the wallet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>createDaccWallet</h1>

      <div className="form">
        <label htmlFor="password">🔑 Enter your password:</label>
        <input
          id="password"
          type="password"
          placeholder="e.g. MyStrongPass#2025"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button onClick={handleCreateWallet} disabled={loading}>
          {loading ? '⏳ Creating...' : 'Create New Wallet'}
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {wallet && (
        <div className="result">
          <h3>🎉 Wallet Created Successfully!</h3>
          <p>
            <strong>Address:</strong> {wallet.address}
          </p>
          <p>
            <strong>Encrypted Public Key:</strong>
          </p>
          <textarea
            readOnly
            value={wallet.daccPublickey}
            rows={5}
          ></textarea>
        </div>
      )}
    </div>
  );
}

export default App;
