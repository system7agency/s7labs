import './Footer.css'

import { System7Logo } from './System7Logo'

export function Footer() {
  return (
    <footer>
      <div className="foot-left">
        <a
          className="foot-logo"
          href="https://system7.ai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="System7"
        >
          <System7Logo height={14} />
        </a>
      </div>
      <div className="foot-right">
        <span>© 2026</span>
      </div>
    </footer>
  )
}
