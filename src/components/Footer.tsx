import './Footer.css'

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
          <span className="foot-logo-wordmark">
            system<sup className="wordmark-superscript">7</sup>
          </span>
        </a>
      </div>
      <div className="foot-right">
        <span>© 2026</span>
      </div>
    </footer>
  )
}
