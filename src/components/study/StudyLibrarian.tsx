'use client'
import { useState } from 'react'

interface StudyLibrarianProps {
  verseKey: string
  selectedLens: string
  arabicText: string
  translationText: string
}

const LENS_PLACEHOLDERS: Record<string, string> = {
  vocabulary: "Ask about a specific word — its root, meaning, or why it was chosen...",
  structure: "Ask about the sentence structure, order of ideas, or literary devices...",
  context: "Ask about when or why this verse was revealed, the historical situation...",
  audience: "Ask about who Allah is speaking to and what message is being sent...",
  relevance: "Ask how scholars understood the timeless lessons in this verse..."
}

const LENS_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  structure: "Structure", 
  context: "Context",
  audience: "Audience",
  relevance: "Relevance"
}

export default function StudyLibrarian({
  verseKey,
  selectedLens,
  arabicText,
  translationText
}: StudyLibrarianProps) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [sources, setSources] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasAsked, setHasAsked] = useState(false)

  async function handleAsk() {
    if (loading) return
    
    setLoading(true)
    setError('')
    setResponse('')
    setSources('')

    try {
      const res = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verseKey,
          lens: selectedLens,
          arabicText,
          translationText,
          question: question.trim()
        })
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setResponse(data.response)
      setSources(data.sources)
      setHasAsked(true)
      setQuestion('')

    } catch {
      setError('Could not reach the librarian. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[var(--gold)]">✦</span>
          <p className="text-sm font-semibold text-[var(--text)]">Ask the Librarian</p>
          <span className="rounded-full border border-[var(--gold-border)] bg-[var(--gold-dim)] px-2 py-0.5 text-xs text-[var(--gold)]">
            {LENS_LABELS[selectedLens]} lens
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          The Librarian surfaces verified scholarship from classical scholars. 
          The reflection is yours to write.
        </p>
      </div>

      {/* Question input */}
      <div className="space-y-2">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !loading) {
              e.preventDefault()
              handleAsk()
            }
          }}
          placeholder={LENS_PLACEHOLDERS[selectedLens] || "Ask anything about this verse..."}
          className="w-full rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm 
            placeholder:text-[var(--muted)] focus:border-white/20 focus:outline-none 
            resize-none min-h-[80px] text-[var(--text)]"
          disabled={loading}
        />
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--muted)]">
            Or leave blank to get a general study guide for this lens
          </p>
          <button
            onClick={handleAsk}
            disabled={loading}
            className="rounded-xl border border-[var(--gold-border)] bg-[var(--gold-dim)] 
              px-4 py-2 text-sm text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--ink)] 
              transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Searching sources...
              </span>
            ) : (
              'Search the Sources'
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-300/80">{error}</p>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="rounded-xl border border-[var(--gold-border)] bg-gradient-to-br 
          from-[var(--gold-dim)] to-transparent p-4 space-y-3">
          
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--gold)]">
            From the Scholars
          </p>
          
          <p className="text-sm leading-7 text-[var(--text)] whitespace-pre-wrap">
            {response}
          </p>
          
          {sources && (
            <div className="border-t border-white/8 pt-3">
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                ✦ {sources}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Encouragement after first use */}
      {hasAsked && !loading && (
        <p className="text-xs text-[var(--muted)] italic">
          Now use what you found to write your own reflection below ↓
        </p>
      )}
    </div>
  )
}
