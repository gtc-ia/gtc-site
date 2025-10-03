const buttonBase =
  'inline-block rounded-xl px-[18px] py-3 font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export default function HeroOverlay() {
  return (
    <div className="relative z-10 mx-auto max-w-[960px] px-6 py-16 text-center text-white md:px-8">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
        Smarter buys, happier life
      </h1>
      <p className="mt-2 text-lg text-white/80">Thanks to AI</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <a
          href="https://t.me/Procurement_AnalystBot"
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonBase} bg-cyan-300 text-[#0b1220] hover:brightness-110 focus-visible:outline-cyan-200`}
        >
          Launch AI assistant
        </a>
        <a
          href="https://app.gtstor.com/news/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonBase} bg-white/15 text-white hover:bg-white/25 focus-visible:outline-white/40`}
        >
          Read the news
        </a>
        <a
          href="https://app.gtstor.com/auth/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonBase} bg-emerald-400 text-[#0b1220] hover:brightness-110 focus-visible:outline-emerald-200`}
        >
          Get access
        </a>
      </div>
      <div className="mt-10 flex flex-col items-center gap-4">
        <span aria-hidden="true" className="h-16 w-px bg-white/20" />
        <a
          href="https://www.gtchain.io/"
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonBase} bg-[#0A1F44] text-white hover:shadow-[0_0_18px_rgba(10,31,68,0.55)]`}
        >
          Visit GTChain
        </a>
      </div>
    </div>
  )
}
