const BOT_ROWS = [
  'Responds to a prompt',
  'Gives an answer',
  'Uses conversation as the main interface',
  'Waits for the user',
  'Works in isolation',
  'Usually stops at text',
]

const AGENT_ROWS = [
  'Responds to an event, objective or workflow state',
  'Completes or coordinates work',
  'Uses tools, systems, context and business logic',
  'Triggers, routes, updates and escalates',
  'Operates inside an orchestrated flow',
  'Can create, update, check, send, route or hand off',
]

export function AgentVsChatbotSection() {
  return (
    <section className="sec reveal" data-sec="01">
      <div className="sec-tag">
        <span className="n">01</span>
        <span className="lbl">
          <span>{'// 01 / 06'}</span>
          <span className="v">CATEGORY CLARITY</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            Not another <span className="accent-text">chatbot.</span>
          </h2>
          <p>Agents are not conversational interfaces. They are controlled systems for work.</p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>
            AGENT <span className="v">≠</span> CHATBOT
          </span>
        </div>
      </div>

      <div className="vs-grid">
        <div className="vs-col bot">
          <div className="vs-head">
            <span className="dt" />
            CHATBOT · responds.to.prompt
          </div>
          <ul className="vs-list" data-side="bot">
            {BOT_ROWS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="vs-col agent">
          <div className="vs-head">
            <span className="dt" />
            AGENT · responds.to.event
          </div>
          <ul className="vs-list" data-side="agent">
            {AGENT_ROWS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="vs-foot">
        — a working layer <span className="v">for multi-step work</span> —
      </div>
    </section>
  )
}
