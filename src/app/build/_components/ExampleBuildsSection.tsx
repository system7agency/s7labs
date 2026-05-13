type Example = {
  mockTitle: string
  mockBody: ('row' | 'row-acc' | 'grid-100' | 'grid-010' | 'grid-001' | 'grid-110')[]
  tag: string
  title: string
  desc: string
}

const EXAMPLES: Example[] = [
  {
    mockTitle: 'customer.portal',
    mockBody: ['row-acc', 'row', 'row', 'grid-100'],
    tag: 'CUSTOMER-FACING',
    title: 'Customer Portal',
    desc: 'A secure interface where customers can access information, submit requests, view outputs or manage activity.',
  },
  {
    mockTitle: 'ops.platform',
    mockBody: ['grid-010', 'row', 'row-acc', 'row'],
    tag: 'INTERNAL',
    title: 'Internal Operations Platform',
    desc: 'A custom system for teams to manage tasks, approvals, documents, status and delivery work.',
  },
  {
    mockTitle: 'partner.dashboard',
    mockBody: ['row-acc', 'grid-001', 'row', 'row'],
    tag: 'PARTNER',
    title: 'Partner Dashboard',
    desc: 'A shared view for partners, suppliers or external stakeholders to access relevant data and actions.',
  },
  {
    mockTitle: 'ai.knowledge',
    mockBody: ['row-acc', 'row', 'row', 'grid-110'],
    tag: 'AI · KNOWLEDGE',
    title: 'AI Knowledge Product',
    desc: 'A searchable, AI-enabled interface over documents, company knowledge, processes or customer information.',
  },
  {
    mockTitle: 'admin.console',
    mockBody: ['grid-001', 'row', 'row-acc', 'row'],
    tag: 'ADMIN',
    title: 'Admin Console',
    desc: 'A central control surface for managing users, records, workflows, approvals and system settings.',
  },
  {
    mockTitle: 'doc.review',
    mockBody: ['row', 'row-acc', 'grid-100', 'row'],
    tag: 'AI · DOCUMENTS',
    title: 'Document Review App',
    desc: 'A tool for uploading, analysing, classifying, checking or summarising documents at scale.',
  },
]

function renderMockItem(item: Example['mockBody'][number], idx: number) {
  if (item === 'row') return <div key={idx} className="row" />
  if (item === 'row-acc') return <div key={idx} className="row acc" />
  const flags = item.slice(5)
  return (
    <div key={idx} className="grid">
      {flags.split('').map((flag, i) => (
        <span key={i} className={flag === '1' ? 'c acc' : 'c'} />
      ))}
    </div>
  )
}

export function ExampleBuildsSection() {
  return (
    <section className="sec reveal">
      <div className="sec-tag">
        <span className="n">06</span>
        <span className="lbl">
          <span>{"// 06 / 06"}</span>
          <span className="v">EXAMPLES</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>The kinds of things we ship.</h2>
          <p>
            Six representative builds — across customer-facing, internal, AI-enabled and admin.
            Yours could be one of these. Or something entirely new.
          </p>
        </div>
        <div className="right">
          <span>6 TYPES</span>
        </div>
      </div>

      <div className="examples-grid">
        {EXAMPLES.map((ex) => (
          <article key={ex.title} className="example" data-example>
            <div className="ex-mock">
              <div className="ex-mock-head">
                <span className="dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="title">{ex.mockTitle}</span>
              </div>
              <div className="ex-mock-body">{ex.mockBody.map(renderMockItem)}</div>
            </div>
            <div className="ex-body">
              <div className="tag">{ex.tag}</div>
              <h4>{ex.title}</h4>
              <p className="desc">{ex.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
