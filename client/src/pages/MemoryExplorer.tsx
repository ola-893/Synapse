import { useMutation } from '@tanstack/react-query';
import { Database, Eye, Key, RefreshCw, RotateCcw, Save, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import DecryptPanel from '../components/DecryptPanel';
import { api } from '../lib/api';

export default function MemoryExplorer() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('alpha trading signals');
  const [secure, setSecure] = useState(false);
  const [selectedBlobId, setSelectedBlobId] = useState<string | null>(null);

  const remember = useMutation({
    mutationFn: () => api.remember(text, secure),
  });

  const recall = useMutation({
    mutationFn: () => api.recall(query, secure),
  });

  const restore = useMutation({
    mutationFn: api.restoreMemory,
  });

  const secureBlobIds = useMemo(() => recall.data?.blobIds ?? [], [recall.data]);
  const memories = recall.data?.memories ?? [];

  return (
    <div className="flex h-full">
      <div className="flex-1 p-10 overflow-auto hide-scrollbar">
        <h1 className="text-5xl font-bold tracking-tight text-on-surface mb-3">Memory Explorer</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed mb-8">
          Store, restore, recall, and decrypt MemWal-backed Synapse memory through the fixed backend APIs.
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Save className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Remember</h2>
            </div>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write a memory payload for the agent..."
              className="h-36 w-full resize-none rounded-lg border border-outline-variant bg-surface p-4 text-sm focus:outline-none focus:border-primary"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
                <input type="checkbox" checked={secure} onChange={(event) => setSecure(event.target.checked)} />
                Seal secure memory
              </label>
              <button
                onClick={() => remember.mutate()}
                disabled={!text.trim() || remember.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Database className="h-4 w-4" />
                {remember.isPending ? 'Saving...' : 'Store Memory'}
              </button>
            </div>
            {remember.data || remember.error ? (
              <pre className="mt-4 max-h-40 overflow-auto rounded-lg border border-outline-variant bg-surface p-3 text-xs">
                {JSON.stringify(remember.data ?? { error: remember.error.message }, null, 2)}
              </pre>
            ) : null}
          </section>

          <section className="bg-surface-dim border border-outline-variant rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Recall</h2>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search memories..."
                className="w-full bg-surface border border-outline-variant rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
                <input type="checkbox" checked={secure} onChange={(event) => setSecure(event.target.checked)} />
                Query secure blobs
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => restore.mutate()}
                  disabled={restore.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </button>
                <button
                  onClick={() => recall.mutate()}
                  disabled={!query.trim() || recall.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-tertiary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {recall.isPending ? 'Searching...' : 'Recall'}
                </button>
              </div>
            </div>
            {restore.data || restore.error ? (
              <p className="mt-3 text-sm text-on-surface-variant">
                {restore.data?.message || restore.error?.message}
              </p>
            ) : null}
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {secureBlobIds.map((blobId) => (
            <article key={blobId} className="bg-surface-dim border border-outline-variant rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-sm bg-surface px-2 py-1 rounded border border-outline-variant">Secure Blob</span>
                <Key className="h-4 w-4 text-tertiary" />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-outline">Blob ID</p>
              <p className="font-mono text-sm truncate text-outline">{blobId}</p>
              <button
                onClick={() => setSelectedBlobId(blobId)}
                className="mt-6 w-full bg-[#c3ecd3] hover:bg-[#a6d8bb] text-[#002113] border border-[#a6d8bb] text-sm font-medium py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" /> Request Decrypt
              </button>
            </article>
          ))}

          {memories.map((memory, index) => (
            <article key={index} className="bg-surface-dim border border-outline-variant rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-sm bg-surface px-2 py-1 rounded border border-outline-variant">Memory #{index + 1}</span>
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs text-on-surface">
                {typeof memory === 'string' ? memory : JSON.stringify(memory, null, 2)}
              </pre>
            </article>
          ))}

          {recall.data && secureBlobIds.length === 0 && memories.length === 0 ? (
            <div className="rounded-lg border border-outline-variant bg-surface-dim p-6 text-sm text-on-surface-variant">
              No memories returned for this query.
            </div>
          ) : null}
        </div>
      </div>

      <aside className="w-[440px] bg-surface-dim border-l border-outline-variant flex flex-col h-full">
        <div className="p-6 border-b border-outline-variant flex items-center gap-3">
          <div className="p-2 bg-surface rounded-lg border border-outline-variant">
            <Key className="w-5 h-5 text-tertiary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Decryption Panel</h2>
            <p className="text-sm text-outline">Requires wallet and OperatorCap</p>
          </div>
        </div>
        <div className="p-6 overflow-auto">
          {selectedBlobId ? (
            <DecryptPanel blobId={selectedBlobId} />
          ) : (
            <p className="text-sm text-on-surface-variant">Select a secure blob from recall results to request Seal decryption.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
