import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Real artifact markdown, styled via `.studio-prose` (see globals.css) to match
// the Claude Design block aesthetics — Playfair headings, copper diamond bullets,
// italic pull-quotes.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="studio-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
