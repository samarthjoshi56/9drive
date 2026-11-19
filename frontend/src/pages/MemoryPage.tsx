import { useEffect, useState } from 'react'
import { Brain, RefreshCw, FileText, ShieldCheck, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'

type MemoryAccount = { id: string; email: string; displayName?: string | null; indexingEnabled: boolean; metadataFileCount: number }
type MemoryFile = { id: string; connectedAccountId: string; name: string; mimeType: string; sizeBytes: string; createdAt: string; updatedAt: string }

export function MemoryPage() {
  const [accounts, setAccounts] = useState<MemoryAccount[]>([])
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const pageSize = 50

  async function loadAccounts() {
    const data = await apiFetch<{ accounts: MemoryAccount[] }>('/memory/accounts')
    setAccounts(data.accounts)
  }

  async function loadFiles(nextOffset = offset) {
    const data = await apiFetch<{ files: MemoryFile[]; total: number; limit: number; offset: number }>(`/memory/files?limit=${pageSize}&offset=${nextOffset}`)
    setFiles(data.files)
    setTotal(data.total)
    setOffset(nextOffset)
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      await loadAccounts()
      await loadFiles(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load memory inventory.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggle(account: MemoryAccount) {
    setBusyId(account.id)
    setError('')
    try {
      await apiFetch<{ indexingEnabled: boolean }>(`/memory/accounts/${account.id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !account.indexingEnabled }),
      })
      await loadAccounts()
      await loadFiles(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update indexing setting.')
    } finally { setBusyId(null) }
  }

  const enabledCount = accounts.filter(a => a.indexingEnabled).length

  return (
    <div className="grid gap-5">
      <PageHeader title="AI Memory" description="Choose which connected Google Drive accounts can be included in your future AI memory." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Cloud className="h-4 w-4" /> Connected accounts</div><div className="mt-2 text-2xl font-extrabold">{accounts.length}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck className="h-4 w-4" /> Indexing enabled</div><div className="mt-2 text-2xl font-extrabold">{enabledCount}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><FileText className="h-4 w-4" /> Metadata inventory</div><div className="mt-2 text-2xl font-extrabold">{total}</div></Card>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-100 p-2 text-violet-700"><Brain className="h-5 w-5" /></div>
          <div><h2 className="font-bold text-slate-900">Indexing controls</h2><p className="mt-1 text-sm text-slate-500">Indexing is off by default. Enable accounts one at a time. This phase only reads file metadata from 9Drive's database. It does not download file contents or send data to AI.</p></div>
        </div>
        {error ? <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <div className="mt-4 grid gap-3">
          {loading ? <p className="text-sm text-slate-500">Loading connected accounts...</p> : accounts.length === 0 ? <p className="text-sm text-slate-500">No connected Google Drive accounts. Connect an account in Settings first.</p> : accounts.map(account => (
            <div key={account.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">{account.displayName || account.email}</div>
                <div className="text-xs text-slate-500 truncate">{account.email} · {account.metadataFileCount} metadata records</div>
              </div>
              <Button variant={account.indexingEnabled ? 'soft' : 'outline'} size="sm" disabled={busyId !== null} onClick={() => toggle(account)}>{busyId === account.id ? 'Saving...' : account.indexingEnabled ? 'Disable indexing' : 'Enable indexing'}</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div><h2 className="font-bold text-slate-900">Indexed account metadata</h2><p className="text-xs text-slate-500">Files from accounts where indexing is enabled</p></div>
          <Button variant="outline" size="sm" onClick={() => loadFiles(0)} disabled={loading}><RefreshCw className="h-4 w-4" />Refresh</Button>
        </div>
        {loading ? <div className="p-4 text-sm text-slate-500">Loading file inventory...</div> : files.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No metadata files available. Enable indexing for an account to view its inventory.</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">File</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Updated</th></tr></thead>
                <tbody>{files.map(file => <tr key={file.id} className="border-t border-slate-100"><td className="max-w-[260px] truncate px-4 py-3 font-medium text-slate-800">{file.name}</td><td className="px-4 py-3 text-slate-500">{file.mimeType}</td><td className="px-4 py-3 text-slate-500">{formatBytes(file.sizeBytes)}</td><td className="px-4 py-3 text-slate-500">{formatDate(file.updatedAt)}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 p-3 text-xs text-slate-500"><span>Showing {offset + 1}–{Math.min(offset + files.length, total)} of {total}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={offset <= 0 || loading} onClick={() => loadFiles(Math.max(0, offset - pageSize))}>Previous</Button><Button variant="outline" size="sm" disabled={offset + pageSize >= total || loading} onClick={() => loadFiles(offset + pageSize)}>Next</Button></div></div>
          </>
        )}
      </Card>
    </div>
  )
}
