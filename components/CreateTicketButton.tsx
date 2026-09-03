'use client'

import { useState } from 'react'
import { Ticket, X, Loader2, CheckCircle } from 'lucide-react'

type Risk = 'low' | 'medium' | 'high' | 'critical'

interface Props {
  defaultTitle?: string
  defaultDescription?: string
  defaultClient?: string
  defaultTags?: string[]
}

const RISK_COLORS: Record<Risk, string> = {
  low:      'border-zinc-600 text-zinc-400 bg-zinc-800/50',
  medium:   'border-blue-700 text-blue-400 bg-blue-950/40',
  high:     'border-amber-700 text-amber-400 bg-amber-950/40',
  critical: 'border-red-700 text-red-400 bg-red-950/40',
}

export default function CreateTicketButton({ defaultTitle = '', defaultDescription = '', defaultClient = '', defaultTags = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState(defaultDescription)
  const [client, setClient] = useState(defaultClient)
  const [risk, setRisk] = useState<Risk>('medium')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setTitle(defaultTitle)
    setDescription(defaultDescription)
    setClient(defaultClient)
    setRisk('medium')
    setSuccess(false)
    setError('')
  }

  const handleOpen = () => { reset(); setOpen(true) }
  const handleClose = () => { setOpen(false); reset() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, client, risk, tags: defaultTags }),
      })
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      if (!res.ok) {
        const msg = typeof data.error === 'string' ? data.error
          : typeof data.message === 'string' ? data.message
          : `HTTP ${res.status}`
        throw new Error(msg)
      }
      setSuccess(true)
      setTimeout(() => { setOpen(false); reset() }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-sm font-medium rounded-lg transition-all shrink-0"
      >
        <Ticket className="w-4 h-4" />
        Create ticket
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-zinc-200">New ticket</span>
              </div>
              <button onClick={handleClose} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <p className="text-sm text-emerald-300 font-medium">Ticket created!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-800 focus:ring-1 focus:ring-cyan-900/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-800 focus:ring-1 focus:ring-cyan-900/30 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Client</label>
                    <input
                      type="text"
                      value={client}
                      onChange={e => setClient(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Priority</label>
                    <select
                      value={risk}
                      onChange={e => setRisk(e.target.value as Risk)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-800"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'critical'] as Risk[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRisk(r)}
                      className={`flex-1 text-[10px] font-semibold uppercase tracking-wider py-1 rounded border transition-all ${risk === r ? RISK_COLORS[r] : 'border-zinc-800 text-zinc-600 bg-transparent hover:border-zinc-700'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleClose} className="flex-1 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !title.trim()}
                    className="flex-1 py-2 text-sm font-medium bg-cyan-900/40 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 rounded-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" />}
                    {loading ? 'Creating…' : 'Create ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
