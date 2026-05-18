'use client'
import { useState, ReactNode } from 'react'

interface StudyLibrarianProps {
  verseKey: string
  selectedLens: string
  arabicText: string
  translationText: string
}

function cleanResponseText(text: string): string {
  // Remove function call artifacts (<invoke>, <parameter>, etc.)
  text = text.replace(/<invoke[^>]*>[\s\S]*?<\/invoke>/g, '')
  text = text.replace(/<function_calls[^>]*>[\s\S]*?<\/function_calls>/g, '')
  text = text.replace(/<parameter[^>]*>[\s\S]*?<\/parameter>/g, '')
  
  // Remove any remaining XML-like tags
  text = text.replace(/<[^>]+>/g, '')
  
  // Remove leading preamble (lines starting with intro text about "I'll help", "let me", etc.)
  const lines = text.split('\n')
  let startIdx = 0
  
  // Skip introductory lines that aren't part of the main response
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase()
    if (line.startsWith('i\'ll') || line.startsWith('let me') || 
        line.startsWith('based on') || line.startsWith('<invoke')) {
      startIdx = i + 1
    } else if (line && !line.startsWith('function') && !line.startsWith('<')) {
      break
    }
  }
  
  // Join remaining lines and clean up
  text = lines.slice(startIdx).join('\n')
  
  // Clean up excessive whitespace
  text = text.replace(/\n\n\n+/g, '\n\n')
  text = text.trim()
  
  return text
}

function parseMarkdownResponse(text: string): ReactNode[] {
  // Clean the response first
  text = cleanResponseText(text)
  
  const lines = text.split('\n')
  const result: ReactNode[] = []
  let i = 0
  let keyCounter = 0

  while (i < lines.length) {
    const line = lines[i]
    const currentKey = keyCounter++
    
    // Headers (## ...)
    if (line.startsWith('## ')) {
      result.push(
        <h3 key={`header-${currentKey}`} className="text-sm font-bold text-[var(--text)] mt-3 mb-2">
          {line.replace('## ', '')}
        </h3>
      )
      i++
      continue
    }

    // Subheaders with bold text (text followed by em-dash or colon)
    if (/^[A-Z][^:\n]*\s?—|^[A-Z][^:\n]*:/.test(line) && !line.startsWith('- ') && !line.startsWith('#')) {
      const boldMatch = line.match(/^([^—:]+)(—|:)(.*)$/)
      if (boldMatch) {
        result.push(
          <p key={`subheader-${currentKey}`} className="text-sm leading-7 text-[var(--text)] mt-2">
            <strong>{boldMatch[1].trim()}</strong>{boldMatch[2]}{boldMatch[3] ? ` ${parseInlineMarkdown(boldMatch[3])}` : ''}
          </p>
        )
        i++
        continue
      }
    }

    // List items (- ...)
    if (line.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(lines[i].replace('- ', ''))
        i++
      }
      result.push(
        <ul key={`ul-${currentKey}`} className="list-disc list-inside space-y-1 text-sm text-[var(--text)] ml-1">
          {listItems.map((item, idx) => (
            <li key={`li-${currentKey}-${idx}`} className="text-[var(--text)]">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      )
      keyCounter++
      continue
    }

    // Numbered items (1. ...)
    if (/^\d+\. /.test(line)) {
      const listItems: string[] = []
      let counter = 1
      while (i < lines.length && new RegExp(`^${counter}\\. `).test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\. /, ''))
        i++
        counter++
      }
      result.push(
        <ol key={`ol-${currentKey}`} className="list-decimal list-inside space-y-1 text-sm text-[var(--text)] ml-1">
          {listItems.map((item, idx) => (
            <li key={`ol-li-${currentKey}-${idx}`} className="text-[var(--text)]">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ol>
      )
      keyCounter++
      continue
    }

    // Empty lines
    if (line.trim() === '') {
      result.push(<div key={`empty-${currentKey}`} className="h-2" />)
      i++
      continue
    }

    // Regular paragraphs
    if (line.trim()) {
      result.push(
        <p key={`para-${currentKey}`} className="text-sm leading-7 text-[var(--text)]">
          {parseInlineMarkdown(line)}
        </p>
      )
    }
    
    i++
  }

  return result
}

function parseInlineMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let keyCounter = 0

  // Match **bold**, *italic*, `code`, and plain text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Add styled match
    const matched = match[0]
    if (matched.startsWith('**')) {
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-semibold text-[var(--text)]">
          {matched.slice(2, -2)}
        </strong>
      )
    } else if (matched.startsWith('*')) {
      parts.push(
        <em key={`italic-${keyCounter++}`} className="italic text-[var(--text)]">
          {matched.slice(1, -1)}
        </em>
      )
    } else if (matched.startsWith('`')) {
      parts.push(
        <code key={`code-${keyCounter++}`} className="bg-white/8 rounded px-1.5 py-0.5 font-mono text-xs text-[var(--gold)]">
          {matched.slice(1, -1)}
        </code>
      )
    }

    lastIndex = regex.lastIndex
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

const LENS_PLACEHOLDERS: Record<string, string> = {
  vocabulary: "Ask about word meanings, purpose, or what makes this phrasing unique...",
  structure: "Ask about the historical context, revelation circumstances, or creation references...",
  context: "Ask what this verse means for you personally or how to apply it in your life...",
  audience: "Ask how this verse connects to other parts of the Quran or surrounding verses...",
  relevance: "Ask about the fundamental lessons, wisdom, or transformational messages here..."
}

const LENS_LABELS: Record<string, string> = {
  vocabulary: "Language Lens",
  structure: "Quranic World", 
  context: "Personal Experience",
  audience: "Connections",
  relevance: "General Lessons"
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
          from-[var(--gold-dim)] to-transparent p-4 space-y-4">
          
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--gold)]">
            From the Scholars
          </p>
          
          <div className="space-y-3 text-[var(--text)]">
            {parseMarkdownResponse(response)}
          </div>
          
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
