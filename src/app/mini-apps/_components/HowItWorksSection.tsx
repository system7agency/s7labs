export function HowItWorksSection() {
  return (
    <section className="sec sec-hiw reveal">
      <div className="hiw-head">
        <div className="hiw-eye">
          <span className="n">{'// 01 / 03'}</span> <span className="v">HOW IT WORKS</span>
        </div>
        <h2 className="hiw-title">
          Browse. <span className="accent-text">Test.</span> Register interest.
        </h2>
        <p className="hiw-sub">
          These are not case studies. They are working products you can open and use directly.
        </p>
      </div>
      <div className="hiw-steps">
        <article className="hiw-step">
          <div className="hs-num">01</div>
          <div className="hs-lbl">BROWSE</div>
          <p>
            Move through a shelf of live mini-products, each designed around a specific problem or
            interaction.
          </p>
        </article>
        <article className="hiw-step">
          <div className="hs-num">02</div>
          <div className="hs-lbl">TEST</div>
          <p>
            Open apps directly from the card or use the app preview to understand how the product
            works.
          </p>
        </article>
        <article className="hiw-step">
          <div className="hs-num">03</div>
          <div className="hs-lbl">REGISTER INTEREST</div>
          <p>
            If an app is relevant, click Interested and S7 can turn the idea into a tailored build.
          </p>
        </article>
      </div>
    </section>
  )
}
