export function OrchestrationMapSection() {
  return (
    <section className="sec reveal" data-sec="04">
      <div className="sec-tag">
        <span className="n">04</span>
        <span className="lbl">
          <span>{'// 04 / 06'}</span>
          <span className="v">ORCHESTRATION</span>
        </span>
      </div>
      <div className="sec-head">
        <div className="left">
          <h2>
            One agent can help. An orchestrated system can{' '}
            <span className="accent-text">change how work moves.</span>
          </h2>
          <p>
            Real value comes from coordination — multiple agents, tools and humans working together
            inside a designed system.
          </p>
        </div>
        <div className="right">
          <span className="pd" />
          <span>
            TIMELINE · <span className="v">SHARED CLOCK</span>
          </span>
        </div>
      </div>

      <div className="gantt">
        <div className="gantt-head">
          <div className="gh-title">
            <span className="livedot" />
            ORCHESTRATION.TIMELINE
          </div>
          <div className="gh-axis">
            <span>T+0:00</span>
            <span>0:30</span>
            <span>1:00</span>
            <span>1:30</span>
            <span>2:00</span>
            <span>2:30</span>
            <span>3:00</span>
            <span>3:30</span>
            <span>4:00</span>
            <span>4:30</span>
            <span>5:00</span>
          </div>
        </div>

        <div className="gantt-body">
          <div className="grp-label">AGENTS</div>

          <div className="grow">
            <div className="gn">
              <span className="d" />
              agent.research <span className="dim">· researcher</span>
            </div>
            <div className="gt">
              <div className="gb" style={{ ['--s' as string]: '2%', ['--w' as string]: '12%' }}>
                <span>context.read</span>
              </div>
              <div className="gb" style={{ ['--s' as string]: '15%', ['--w' as string]: '6%' }}>
                <span>summarise</span>
              </div>
            </div>
            <div className="gs">done</div>
          </div>

          <div className="grow">
            <div className="gn">
              <span className="d" />
              agent.review <span className="dim">· reviewer</span>
            </div>
            <div className="gt">
              <div className="gb" style={{ ['--s' as string]: '20%', ['--w' as string]: '8%' }}>
                <span>qa.check</span>
              </div>
            </div>
            <div className="gs">done</div>
          </div>

          <div className="grow-primary grow">
            <div className="gn">
              <span className="d" />
              agent.orchestrator <span className="dim">· coordinator</span>
            </div>
            <div className="gt">
              <div
                className="gb gb-strong"
                style={{ ['--s' as string]: '6%', ['--w' as string]: '84%' }}
              >
                <span>route → context → tools → review → action → handoff</span>
                <div className="gb-cursor" style={{ ['--at' as string]: '62%' }} />
              </div>
            </div>
            <div className="gs v">routing</div>
          </div>

          <div className="grow">
            <div className="gn">
              <span className="d" />
              agent.operator <span className="dim">· operator</span>
            </div>
            <div className="gt">
              <div className="gb" style={{ ['--s' as string]: '30%', ['--w' as string]: '10%' }}>
                <span>tool.call</span>
              </div>
              <div className="gb" style={{ ['--s' as string]: '42%', ['--w' as string]: '8%' }}>
                <span>record.update</span>
              </div>
            </div>
            <div className="gs">done</div>
          </div>

          <div className="grow">
            <div className="gn">
              <span className="d" />
              agent.report <span className="dim">· reporter</span>
            </div>
            <div className="gt">
              <div className="gb" style={{ ['--s' as string]: '62%', ['--w' as string]: '22%' }}>
                <span>draft.brief</span>
              </div>
            </div>
            <div className="gs v">drafting</div>
          </div>

          <div className="grp-label amb">HUMAN GATE</div>

          <div className="grow-gate grow">
            <div className="gn">
              <span className="d amb" />
              human.gate <span className="dim">· approval</span>
            </div>
            <div className="gt">
              <div className="gd" style={{ ['--at' as string]: '24%' }}>
                <span>approve&nbsp;send</span>
              </div>
              <div className="gd gd-resolved" style={{ ['--at' as string]: '54%' }}>
                <span>approve&nbsp;publish</span>
              </div>
              <div className="gd" style={{ ['--at' as string]: '88%' }}>
                <span>approve&nbsp;close</span>
              </div>
            </div>
            <div className="gs amb">await · 2 open</div>
          </div>

          <div className="grp-label">TOOLS &amp; SYSTEMS</div>

          <div className="grow-tool grow">
            <div className="gn">
              <span className="d" />
              tool.crm
            </div>
            <div className="gt">
              <div className="gp" style={{ ['--at' as string]: '18%' }} />
              <div className="gp" style={{ ['--at' as string]: '36%' }} />
              <div className="gp" style={{ ['--at' as string]: '48%' }} />
            </div>
            <div className="gs dim">3 reads</div>
          </div>

          <div className="grow-tool grow">
            <div className="gn">
              <span className="d" />
              tool.docs
            </div>
            <div className="gt">
              <div className="gp" style={{ ['--at' as string]: '10%' }} />
              <div className="gp" style={{ ['--at' as string]: '14%' }} />
              <div className="gp" style={{ ['--at' as string]: '68%' }} />
            </div>
            <div className="gs dim">3 reads</div>
          </div>

          <div className="grow-tool grow">
            <div className="gn">
              <span className="d" />
              tool.database
            </div>
            <div className="gt">
              <div className="gp" style={{ ['--at' as string]: '32%' }} />
              <div className="gp" style={{ ['--at' as string]: '46%' }} />
            </div>
            <div className="gs dim">2 writes</div>
          </div>

          <div className="grow-tool grow">
            <div className="gn">
              <span className="d" />
              mcp.custom
            </div>
            <div className="gt">
              <div className="gp" style={{ ['--at' as string]: '40%' }} />
              <div className="gp" style={{ ['--at' as string]: '58%' }} />
            </div>
            <div className="gs dim">2 calls</div>
          </div>
        </div>

        <div className="gantt-foot">
          <span className="lf-label">AUDIT.LOG ▸</span>
          <div className="gf-stream" id="gfStream">
            <span className="gl">
              [12:04:18]&nbsp;<span className="ag">agent.research</span> → tool.brave_search ·{' '}
              <span className="v">query.dispatched</span>
            </span>
          </div>
        </div>
      </div>

      <div className="orch-line">
        Agents, tools, humans — <span className="v">coordinated.</span>
      </div>
    </section>
  )
}
