import { useState } from 'react';
import DecryptPanel from '../components/DecryptPanel';

export default function MemoryExplorer() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [secureResults, setSecureResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (secure: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/memory/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, secure })
      });
      const data = await res.json();
      
      if (secure) {
        setSecureResults(data.blobIds || []);
        setResults([]);
      } else {
        setResults(data.memories || []);
        setSecureResults([]);
      }
    } catch (e) {
      console.error("Search failed", e);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Agent Memory Explorer</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search agent memories..."
          style={{ padding: '8px', width: '300px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={() => handleSearch(false)} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Search Public MemWal
        </button>
        <button onClick={() => handleSearch(true)} disabled={loading} style={{ padding: '8px 16px', background: '#8B5CF6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Search Secure Seal
        </button>
      </div>

      {loading && <p>Searching...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {results.map((mem, idx) => (
          <div key={idx} style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
            <p style={{ margin: '0 0 10px 0' }}>{mem.text}</p>
            <small style={{ color: '#6b7280' }}>Distance: {mem.distance?.toFixed(4)}</small>
          </div>
        ))}

        {secureResults.map((blobId, idx) => (
          <div key={idx} style={{ padding: '15px', border: '1px solid #8B5CF6', borderRadius: '8px', background: '#f5f3ff' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#6d28d9' }}>🔒 Encrypted Blob: {blobId}</p>
            <DecryptPanel blobId={blobId} />
          </div>
        ))}
      </div>
    </div>
  );
}
