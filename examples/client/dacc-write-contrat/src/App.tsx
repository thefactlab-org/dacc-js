import { useState } from 'react';
import { daccWriteContract } from 'dacc-js';
import { optimismSepolia } from 'viem/chains';
import './App.css';

const erc20Abi = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

function App() {
  const [daccPublickey, setDaccPublickey] = useState('');
  const [password, setPassword] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tx, setTx] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleWrite = async () => {
    try {
      setLoading(true);
      setError(null);
      setTx(null);

      const decimals = 18n;
      const amountInWei = BigInt(Math.floor(amount * 10 ** Number(decimals)));

      const result = await daccWriteContract({
        daccPublickey,
        passwordSecretkey: password,
        network: optimismSepolia,
        contractAddress: contractAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, amountInWei],
      });

      setTx(result);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('❌ Error executing writeContract:', err);
      setError(err.message || 'Failed to write contract.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTx(null);
    setError(null);
  };

  return (
    <div className="container">
      <h1>Write Contract (daccWriteContract)</h1>
      <h2>
        on <b>Optimism Sepolia</b> Network
      </h2>

      {!tx && !loading && (
        <div className="form">
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

          <label>Contract Address</label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />

          <label>Recipient</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />

          <label>Amount (Token)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            step="0.01"
          />

          <button onClick={handleWrite} disabled={loading}>
            {loading ? '⏳ Sending...' : 'Write Contract()'}
          </button>

          {error && <p className="error">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="result">
          <h3>Write Contract()...</h3>
          <p>Please wait, your executing writeContract is being processed.</p>
        </div>
      )}

      {tx && (
        <div className="result">
          <h3>✅ Transaction</h3>
          <p>
            <strong>Tx Hash:</strong>{' '}
            <a
              href={`https://testnet-explorer.optimism.io/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tx.txHash}
            </a>
          </p>
          <p>
            <strong>Function:</strong> {tx.functionName}
          </p>
          <p>
            <strong>Args:</strong>{' '}
            {JSON.stringify(tx.args, (_, v) =>
              typeof v === 'bigint' ? v.toString() : v
            )}
          </p>
          <p>
            <strong>Contract:</strong> {tx.contractAddress}
          </p>
          <button onClick={handleReset}>Back</button>
        </div>
      )}
    </div>
  );
}

export default App;
