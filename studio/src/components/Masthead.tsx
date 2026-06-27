import Link from 'next/link'

// Sticky, blurred masthead with breadcrumb. Ported from the Claude Design.
export function Masthead({
  crumb,
}: {
  crumb?: { caseTitle: string; caseSlug: string; view: 'reader' | 'verdict' }
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(13,20,28,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(224,217,207,0.12)',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 10, textDecoration: 'none' }}>
          <span className="font-display" style={{ fontSize: 23, fontWeight: 600, letterSpacing: '-0.01em', color: '#f0eee8' }}>
            ProveIt
          </span>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c4956a', transform: 'translateY(-3px)' }} />
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6a8a8a' }}>
            Studio
          </span>
        </Link>

        <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5 }}>
          <Link href="/" style={{ color: crumb ? '#6a8a8a' : '#f0eee8', textDecoration: 'none' }}>
            Registry
          </Link>
          {crumb && (
            <>
              <span style={{ color: '#3f5252' }}>/</span>
              <Link
                href={`/idea/${crumb.caseSlug}`}
                style={{
                  color: crumb.view === 'reader' ? '#f0eee8' : '#6a8a8a',
                  textDecoration: 'none',
                  maxWidth: 240,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {crumb.caseTitle}
              </Link>
              {crumb.view === 'verdict' && (
                <>
                  <span style={{ color: '#3f5252' }}>/</span>
                  <span style={{ color: '#c4956a' }}>Verdict</span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
