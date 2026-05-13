import { DesignAgentButton } from './DesignAgentButton'

export function AgentHero() {
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="accent-dot" />
            <span>
              S7_AGENTS <span className="v">{'//'}</span> AGENTIC SYSTEMS
            </span>
          </div>

          <h1 className="hero-title">
            <span className="line l1" aria-label="Build agents">
              <span className="typed" data-text="Build agents" />
              <span className="caret" aria-hidden="true" />
            </span>
            <span className="line l2">
              <span className="accent-text">that can actually do the work.</span>
            </span>
          </h1>

          <p className="hero-sub">
            System7 designs agentic systems that reason across context, use tools, follow business
            rules and coordinate multi-step work. We connect agents to the systems your business
            already runs on, with human gates, permissions and observability built in from the
            start.
          </p>

          <div className="cta-row">
            <DesignAgentButton />
            <a className="btn ghost" href="#agent-os">
              <span>Explore agent architecture</span>
            </a>
          </div>
        </div>

        <div className="hud" id="hud" aria-hidden="true">
          <div className="hud-floats">
            <span className="hf hf-1">
              <i />
              agents.online
            </span>
            <span className="hf hf-2">
              <i />
              tools.connected
            </span>
            <span className="hf hf-3">
              <i className="amb" />
              human.gates.active
            </span>
            <span className="hf hf-4">
              <i />
              mcp.enabled
            </span>
            <span className="hf hf-5">
              <i />
              audit.log
            </span>
            <span className="hf hf-6">
              <i className="amb" />
              action.pending
            </span>
          </div>

          <div className="hud-frame">
            <div className="hud-head">
              <div className="hud-title">
                <span className="livedot" />
                <span>AGENT.TELEMETRY</span>
                <span className="sep">·</span>
                <span className="v">LIVE</span>
              </div>
              <div className="hud-clock">
                <span className="lbl">T</span>
                <span className="time" id="hudClock">
                  04:37:18
                </span>
                <span className="zone">UTC</span>
              </div>
            </div>

            <div className="hud-axis">
              <span>T+0</span>
              <span>T+30</span>
              <span>T+60</span>
              <span>T+90</span>
              <span>T+120</span>
              <span>T+150</span>
            </div>

            <div className="lanes">
              <div className="lane">
                <div className="lane-name">
                  <span className="d" />
                  agent.research
                </div>
                <div className="lane-track">
                  <div
                    className="bar"
                    style={{ ['--start' as string]: '2%', ['--w' as string]: '14%' }}
                  />
                  <div
                    className="bar"
                    style={{ ['--start' as string]: '18%', ['--w' as string]: '8%' }}
                  />
                </div>
                <div className="lane-status">done</div>
              </div>

              <div className="lane">
                <div className="lane-name">
                  <span className="d" />
                  agent.review
                </div>
                <div className="lane-track">
                  <div
                    className="bar"
                    style={{ ['--start' as string]: '20%', ['--w' as string]: '10%' }}
                  />
                </div>
                <div className="lane-status">done</div>
              </div>

              <div className="lane lane-primary">
                <div className="lane-name">
                  <span className="d" />
                  agent.orchestrator
                </div>
                <div className="lane-track">
                  <div
                    className="bar b-strong"
                    style={{ ['--start' as string]: '6%', ['--w' as string]: '78%' }}
                  />
                  <div className="bar-tick" style={{ ['--at' as string]: '14%' }} />
                  <div className="bar-tick" style={{ ['--at' as string]: '32%' }} />
                  <div className="bar-tick" style={{ ['--at' as string]: '50%' }} />
                  <div className="bar-tick" style={{ ['--at' as string]: '68%' }} />
                  <div className="bar-cursor" style={{ ['--at' as string]: '62%' }} />
                </div>
                <div className="lane-status v">routing</div>
              </div>

              <div className="lane">
                <div className="lane-name">
                  <span className="d" />
                  agent.operator
                </div>
                <div className="lane-track">
                  <div
                    className="bar"
                    style={{ ['--start' as string]: '36%', ['--w' as string]: '14%' }}
                  />
                  <div
                    className="bar"
                    style={{ ['--start' as string]: '52%', ['--w' as string]: '6%' }}
                  />
                </div>
                <div className="lane-status">done</div>
              </div>

              <div className="lane">
                <div className="lane-name">
                  <span className="d" />
                  agent.report
                </div>
                <div className="lane-track">
                  <div
                    className="bar"
                    style={{ ['--start' as string]: '58%', ['--w' as string]: '18%' }}
                  />
                </div>
                <div className="lane-status v">drafting</div>
              </div>

              <div className="lane lane-gate">
                <div className="lane-name">
                  <span className="d amb" />
                  human.gate
                </div>
                <div className="lane-track">
                  <div className="gate-diamond" style={{ ['--at' as string]: '48%' }} />
                  <div
                    className="gate-diamond gate-resolved"
                    style={{ ['--at' as string]: '72%' }}
                  />
                </div>
                <div className="lane-status amb">await</div>
              </div>

              <div className="lane lane-tool">
                <div className="lane-name">
                  <span className="d" />
                  tool.crm
                </div>
                <div className="lane-track">
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '14%', ['--w' as string]: '3%' }}
                  />
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '38%', ['--w' as string]: '3%' }}
                  />
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '54%', ['--w' as string]: '3%' }}
                  />
                </div>
                <div className="lane-status dim">read</div>
              </div>

              <div className="lane lane-tool">
                <div className="lane-name">
                  <span className="d" />
                  tool.docs
                </div>
                <div className="lane-track">
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '10%', ['--w' as string]: '3%' }}
                  />
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '26%', ['--w' as string]: '3%' }}
                  />
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '64%', ['--w' as string]: '3%' }}
                  />
                </div>
                <div className="lane-status dim">read</div>
              </div>

              <div className="lane lane-tool">
                <div className="lane-name">
                  <span className="d" />
                  tool.api
                </div>
                <div className="lane-track">
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '42%', ['--w' as string]: '3%' }}
                  />
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '50%', ['--w' as string]: '3%' }}
                  />
                  <div
                    className="bar b-pulse"
                    style={{ ['--start' as string]: '74%', ['--w' as string]: '3%' }}
                  />
                </div>
                <div className="lane-status dim">write</div>
              </div>
            </div>

            <div className="hud-foot">
              <div className="hud-status">
                <span className="v">▸</span>
                <span className="cycler" id="hudCycler">
                  reading.context
                </span>
              </div>
              <div className="hud-pills">
                <span className="pill">CRM</span>
                <span className="pill">DOCS</span>
                <span className="pill">DB</span>
                <span className="pill">API</span>
                <span className="pill pill-mcp">MCP</span>
                <span className="pill">SLACK</span>
                <span className="pill">BRAVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
