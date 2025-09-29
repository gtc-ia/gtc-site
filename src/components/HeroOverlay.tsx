const buttonBase =
  'inline-block rounded-xl px-[18px] py-3 font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export default function HeroOverlay() {
  return (
    <div className="relative z-10 mx-auto flex max-w-[960px] flex-col px-6 pb-20 pt-16 text-center text-white md:px-8">
      <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
        <span className="block">Smarter</span>
        <span className="block">buys,</span>
        <span className="block">happier</span>
        <span className="block">life —</span>
        <span className="block pl-6 md:pl-8">thanks to AI</span>
      </h1>

      <div className="mt-14 flex justify-center">
        <div className="relative flex h-48 w-48 items-center justify-center md:h-56 md:w-56">
          <div className="absolute inset-0 rounded-full border border-white/40" aria-hidden />

          <a
            href="https://t.me/Procurement_AnalystBot"
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBase} absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-cyan-300 text-[#0b1220] hover:brightness-110 focus-visible:outline-cyan-200`}
          >
            AI advisor
          </a>
          <a
            href="https://app.gtstor.com/news/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBase} absolute -bottom-2 left-0 -translate-y-1/2 bg-white/15 text-white hover:bg-white/25 focus-visible:outline-white/40 md:-bottom-4 md:left-2`}
          >
            News
          </a>
          <a
            href="https://pay.gtstor.com/payment.php"
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBase} absolute -bottom-2 right-0 -translate-y-1/2 bg-emerald-400 text-[#0b1220] hover:brightness-110 focus-visible:outline-emerald-200 md:-bottom-4 md:right-2`}
          >
            Subscribe
          </a>
        </div>
      </div>
    </div>
  )
}
