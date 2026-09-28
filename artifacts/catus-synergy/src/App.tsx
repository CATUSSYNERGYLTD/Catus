import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

const navItems = [
  ['Home', '#home'],
  ['About', '#about'],
  ['Businesses', '#businesses'],
  ['Approach', '#approach'],
  ['Ecosystem', '#ecosystem'],
  ['Contact', '#contact'],
];

const businesses = [
  'Real Estate & Construction',
  'Environmental Management',
  'Property Management',
  'Import & Export',
  'Consultancy',
  'Cleaning Services',
];

const principles = ['Cooperation', 'Partnership', 'People', 'Innovation', 'Growth'];

const approach = [
  ['01', 'BUILD', 'We build.'],
  ['02', 'CONNECT', 'We connect opportunities and people.'],
  ['03', 'MANAGE', 'We manage with discipline.'],
  ['04', 'GROW', 'We grow sustainably.'],
];

function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/brand/catus-synergy-wordmark.png"
      alt="Catus Synergy Limited"
      className={compact ? 'h-12 w-[92px] object-cover' : 'h-auto w-[180px]'}
      data-testid={compact ? 'img-wordmark-footer' : 'img-wordmark'}
    />
  );
}

function Header({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (open: boolean) => void }) {
  return (
    <header className="nav-glass fixed inset-x-0 top-0 z-50">
      <div className="container-wide flex h-[76px] items-center justify-between px-5 lg:px-8">
        <a href="#home" className="flex items-center" aria-label="Catus Synergy home" onClick={() => setMenuOpen(false)} data-testid="link-home-logo">
          <BrandWordmark compact />
        </a>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {navItems.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono-brand text-[10px] uppercase tracking-[.14em] text-slate-300 transition-colors hover:text-white"
              data-testid={`link-nav-${label.toLowerCase()}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          href="#contact"
          className="hidden items-center gap-2 border border-blue-400/50 px-4 py-2.5 font-mono-brand text-[10px] uppercase tracking-[.13em] text-blue-100 transition-colors hover:border-blue-300 hover:bg-blue-500/15 lg:flex"
          data-testid="link-header-conversation"
        >
          Start a conversation <ArrowUpRight size={13} />
        </a>
        <button
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center border border-slate-600/60 text-slate-100 lg:hidden"
          data-testid="button-mobile-menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <nav className="border-t border-slate-700/40 bg-[#091426] px-5 py-5 lg:hidden" aria-label="Mobile navigation">
          {navItems.map(([label, href], index) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between border-b border-slate-700/40 py-4 font-mono-brand text-xs uppercase tracking-[.14em] text-slate-200"
              data-testid={`link-mobile-nav-${label.toLowerCase()}`}
            >
              <span>{String(index + 1).padStart(2, '0')} / {label}</span>
              <ArrowUpRight size={14} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBusiness, setActiveBusiness] = useState(0);

  useEffect(() => {
    document.title = 'Catus Synergy Limited — Building What Moves Growth';
  }, []);

  return (
    <div className="site-shell min-h-[100dvh]">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <main>
        <section id="home" className="relative flex min-h-[100dvh] items-end overflow-hidden pt-24" aria-labelledby="hero-title">
          <div className="ghost-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="hero-orb ambient-drift pointer-events-none absolute -right-[18%] top-[9%] h-[680px] w-[680px] rounded-full opacity-70" />
          <div className="pointer-events-none absolute left-[7%] top-[22%] hidden h-px w-[19%] bg-blue-400/30 lg:block" />
          <div className="container-wide relative grid w-full items-end gap-12 px-5 pb-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-8 lg:px-8 lg:pb-20">
            <div className="max-w-[720px]">
              <div className="reveal mb-8 flex items-center gap-4">
                <span className="eyebrow">Lagos · Nigeria</span>
                <span className="line-grow hidden h-px w-24 bg-blue-400/50 sm:block" />
                <span className="font-mono-brand text-[10px] uppercase tracking-[.16em] text-slate-500">01 / 08</span>
              </div>
              <h1 id="hero-title" className="display reveal reveal-delay-1 max-w-[780px] text-[clamp(3.8rem,9.2vw,8.8rem)] font-medium text-slate-50">
                Building What<br /><span className="text-blue-400">Moves Growth.</span>
              </h1>
              <p className="reveal reveal-delay-2 mt-8 max-w-[510px] text-base leading-7 text-slate-300 sm:text-lg">
                A diversified parent company building, managing and connecting ventures, services and opportunities for sustainable growth.
              </p>
              <div className="reveal reveal-delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#about" className="group inline-flex items-center justify-between gap-8 bg-blue-600 px-5 py-4 font-mono-brand text-[10px] uppercase tracking-[.14em] text-white transition-colors hover:bg-blue-500" data-testid="link-hero-explore">
                  Explore Catus Synergy <ArrowDownRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                </a>
                <a href="#businesses" className="group inline-flex items-center justify-between gap-8 border border-slate-500/70 px-5 py-4 font-mono-brand text-[10px] uppercase tracking-[.14em] text-slate-100 transition-colors hover:border-blue-300 hover:text-blue-200" data-testid="link-hero-businesses">
                  Our businesses <ArrowDownRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                </a>
              </div>
            </div>
            <div className="relative flex min-h-[310px] items-center justify-center lg:min-h-[540px]">
              <div className="absolute h-[min(72vw,510px)] w-[min(72vw,510px)] rounded-full border border-blue-300/15" />
              <div className="absolute h-[min(56vw,395px)] w-[min(56vw,395px)] rounded-full border border-dashed border-blue-300/15" />
              <div className="logo-frame blue-field relative h-[min(68vw,430px)] w-[min(68vw,430px)] overflow-hidden">
                <img src="/brand/catus-gorilla-mark.png" alt="Catus Synergy gorilla mark" className="ambient-drift h-full w-full object-cover" data-testid="img-hero-gorilla" />
                <span className="absolute bottom-5 left-5 font-mono-brand text-[9px] uppercase tracking-[.18em] text-white/70">Original mark / 01</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-5 left-5 hidden font-mono-brand text-[9px] uppercase tracking-[.15em] text-slate-500 sm:block lg:left-8">A company that moves</div>
          <a href="#about" className="absolute bottom-5 right-5 hidden items-center gap-3 font-mono-brand text-[9px] uppercase tracking-[.15em] text-slate-500 lg:flex" data-testid="link-scroll-about">Scroll to explore <span className="h-8 w-px bg-slate-600" /></a>
        </section>

        <section id="about" className="section-pad relative border-t border-slate-700/40" aria-labelledby="about-title">
          <div className="container-wide grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
            <div>
              <span className="eyebrow">02 / The company</span>
              <div className="mt-8 h-px w-20 bg-blue-500" />
            </div>
            <div>
              <h2 id="about-title" className="display max-w-[830px] text-[clamp(3rem,7vw,7rem)] font-medium text-slate-50">We Build<br /><span className="text-slate-500">With Purpose.</span></h2>
              <div className="mt-12 grid gap-8 border-t border-slate-700/50 pt-7 sm:grid-cols-[1.2fr_.8fr]">
                <p className="max-w-[580px] text-xl leading-8 text-slate-200">
                  Catus Synergy Limited is a diversified parent company building, managing and connecting ventures, services and opportunities for sustainable growth.
                </p>
                <p className="text-sm leading-7 text-slate-400">
                  Across its business areas, Catus Synergy creates room for practical work, considered management and meaningful connection. The direction is clear: build what moves growth.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="businesses" className="section-pad border-t border-slate-700/40 bg-[#091527]" aria-labelledby="businesses-title">
          <div className="container-wide">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <span className="eyebrow">03 / Areas of work</span>
                <h2 id="businesses-title" className="display mt-7 max-w-[600px] text-[clamp(3.1rem,7vw,7rem)] font-medium text-slate-50">Our<br /><span className="text-blue-400">Businesses.</span></h2>
              </div>
              <p className="max-w-[280px] pb-2 text-sm leading-6 text-slate-400">Six areas. One connected direction. Explore the range of work held within Catus Synergy.</p>
            </div>
            <div className="mt-16 border-t border-slate-600/50">
              {businesses.map((business, index) => (
                <button
                  key={business}
                  type="button"
                  onClick={() => setActiveBusiness(index)}
                  className={`business-row flex w-full items-center gap-4 border-b border-slate-600/50 py-6 text-left sm:py-7 ${activeBusiness === index ? 'bg-blue-600/10' : ''}`}
                  aria-pressed={activeBusiness === index}
                  data-testid={`button-business-${index}`}
                >
                  <span className="row-index w-10 shrink-0 font-mono-brand text-[11px] text-slate-500">0{index + 1}</span>
                  <span className={`text-[clamp(1.2rem,2.7vw,2.5rem)] tracking-[-.035em] ${activeBusiness === index ? 'text-slate-50' : 'text-slate-300'}`}>{business}</span>
                  <ArrowUpRight size={18} className={`ml-auto shrink-0 transition-colors ${activeBusiness === index ? 'text-blue-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>
            <div className="mt-8 flex min-h-12 items-center justify-between gap-6 text-sm text-slate-400">
              <span className="font-mono-brand text-[10px] uppercase tracking-[.14em] text-blue-300">Selected area</span>
              <span className="text-right text-slate-200" data-testid="text-selected-business">{businesses[activeBusiness]}</span>
            </div>
          </div>
        </section>

        <section id="synergy" className="section-pad relative overflow-hidden border-t border-slate-700/40" aria-labelledby="synergy-title">
          <div className="absolute right-[-10%] top-16 h-[430px] w-[430px] rounded-full border border-blue-500/10" />
          <div className="container-wide relative">
            <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
              <div>
                <span className="eyebrow">04 / The synergy</span>
                <p className="mt-10 max-w-[210px] font-mono-brand text-[10px] uppercase leading-5 tracking-[.14em] text-slate-500">Growth is a shared direction, not a solitary motion.</p>
              </div>
              <div>
                <h2 id="synergy-title" className="display max-w-[790px] text-[clamp(2.8rem,6vw,6.6rem)] font-medium text-slate-50">Cooperative<br /><span className="text-blue-400">Attitude Towards Growth.</span></h2>
                <div className="mt-16 grid border-t border-slate-700/50 sm:grid-cols-5">
                  {principles.map((principle, index) => (
                    <div key={principle} className="principle border-b border-slate-700/50 px-3 py-5 first:pl-0 sm:border-b-0 sm:border-r sm:py-6 sm:first:pl-0 sm:last:border-r-0">
                      <span className="font-mono-brand text-[10px] text-blue-400">0{index + 1}</span>
                      <p className="mt-9 text-sm text-slate-200">{principle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-pad-tight border-t border-slate-700/40 bg-[#0b1b34]" aria-labelledby="symbol-title">
          <div className="container-wide grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
            <div className="blue-field logo-frame relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden">
              <img src="/brand/catus-gorilla-mark.png" alt="The Catus Synergy gorilla visual symbol" loading="lazy" className="h-full w-full object-cover" data-testid="img-symbol-gorilla" />
              <span className="absolute left-6 top-6 font-mono-brand text-[9px] uppercase tracking-[.18em] text-white/70">The symbol</span>
            </div>
            <div className="lg:pl-10">
              <span className="eyebrow">05 / The symbol</span>
              <h2 id="symbol-title" className="display mt-7 text-[clamp(2.8rem,5vw,5.5rem)] font-medium text-slate-50">A mark<br /><span className="text-slate-400">that moves with us.</span></h2>
              <p className="mt-9 max-w-[460px] text-base leading-7 text-slate-300">The gorilla is Catus Synergy’s visual symbol. It is a distinctive part of the company’s identity — presented here in its original form.</p>
            </div>
          </div>
        </section>

        <section id="approach" className="section-pad border-t border-slate-700/40" aria-labelledby="approach-title">
          <div className="container-wide">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <span className="eyebrow">06 / How we move</span>
                <h2 id="approach-title" className="display mt-7 text-[clamp(3rem,7vw,7rem)] font-medium text-slate-50">Our<br /><span className="text-blue-400">Approach.</span></h2>
              </div>
              <p className="max-w-[310px] text-sm leading-6 text-slate-400">Four simple actions for building a connected, well-managed path to sustainable growth.</p>
            </div>
            <div className="mt-16 grid border-t border-slate-600/50 md:grid-cols-4">
              {approach.map(([number, title, copy]) => (
                <article key={title} className="principle group border-b border-slate-600/50 px-0 py-7 md:min-h-[300px] md:border-b-0 md:border-r md:px-7 md:py-8 md:first:pl-0 md:last:border-r-0">
                  <div className="flex items-start justify-between">
                    <span className="font-mono-brand text-[10px] text-blue-400">{number}</span>
                    <ArrowUpRight size={17} className="text-slate-600 transition-colors group-hover:text-blue-300" />
                  </div>
                  <h3 className="mt-20 text-2xl tracking-[-.04em] text-slate-50">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="ecosystem" className="section-pad border-t border-slate-700/40 bg-[#091527]" aria-labelledby="ecosystem-title">
          <div className="container-wide">
            <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
              <div>
                <span className="eyebrow">07 / Future-facing</span>
                <h2 id="ecosystem-title" className="display mt-7 text-[clamp(3rem,6.5vw,6.6rem)] font-medium text-slate-50">One<br /><span className="text-blue-400">ecosystem.</span></h2>
              </div>
              <div>
                <p className="max-w-[560px] text-xl leading-8 text-slate-200">Catus Synergy is the parent company — a structure ready to connect future subsidiaries and brands as they take shape.</p>
                <div className="relative mt-14 min-h-[320px] border border-blue-400/25 bg-[#07111f] p-5 sm:p-8">
                  <div className="absolute left-1/2 top-1/2 h-px w-[74%] -translate-x-1/2 bg-blue-400/25" />
                  <div className="absolute left-1/2 top-1/2 h-[74%] w-px -translate-x-1/2 -translate-y-1/2 bg-blue-400/25" />
                  <div className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300 bg-[#0e2b5b] text-center shadow-[0_0_0_10px_rgba(47,109,245,.08)] sm:h-36 sm:w-36">
                    <span className="max-w-[90px] font-mono-brand text-[10px] uppercase leading-4 tracking-[.1em] text-white">Catus<br />Synergy</span>
                  </div>
                  {[
                    ['top-5 left-1/2 -translate-x-1/2', 'Future portfolio'],
                    ['bottom-5 left-1/2 -translate-x-1/2', 'Future portfolio'],
                    ['left-5 top-1/2 -translate-y-1/2', 'Future portfolio'],
                    ['right-5 top-1/2 -translate-y-1/2', 'Future portfolio'],
                  ].map(([position, label], index) => (
                    <div key={index} className={`absolute ${position} border border-slate-600 bg-[#0c1c32] px-3 py-2 text-center sm:px-4`}>
                      <span className="font-mono-brand text-[9px] uppercase tracking-[.12em] text-slate-400">{label}</span>
                    </div>
                  ))}
                  <span className="absolute bottom-3 right-4 font-mono-brand text-[9px] uppercase tracking-[.14em] text-slate-600">Architecture / extensible</span>
                </div>
                <p className="mt-5 font-mono-brand text-[10px] uppercase tracking-[.14em] text-slate-500">No subsidiary names have been supplied — this space is intentionally future-facing.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="section-pad relative overflow-hidden border-t border-slate-700/40" aria-labelledby="contact-title">
          <div className="hero-orb pointer-events-none absolute -left-[20%] bottom-[-30%] h-[600px] w-[600px] rounded-full opacity-45" />
          <div className="container-wide relative">
            <span className="eyebrow">08 / Start here</span>
            <div className="mt-8 flex flex-col justify-between gap-12 lg:flex-row lg:items-end">
              <h2 id="contact-title" className="display max-w-[850px] text-[clamp(3.6rem,9vw,9rem)] font-medium text-slate-50">Let’s build<br /><span className="text-blue-400">what’s next.</span></h2>
              <a href="mailto:info@catussynergy.com" className="group inline-flex shrink-0 items-center gap-5 bg-blue-600 px-6 py-5 font-mono-brand text-[10px] uppercase tracking-[.15em] text-white transition-colors hover:bg-blue-500" data-testid="link-start-conversation">
                Start a conversation <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
            </div>
            <div className="mt-20 grid border-t border-slate-600/50 pt-8 sm:grid-cols-2 lg:grid-cols-4">
              <a href="https://maps.google.com/?q=Lagos,Nigeria" target="_blank" rel="noreferrer" className="mb-8 flex items-start gap-3 text-sm text-slate-300 transition-colors hover:text-blue-300 sm:mb-0" data-testid="link-contact-location">
                <MapPin size={16} className="mt-0.5 text-blue-400" /><span>Lagos, Nigeria</span>
              </a>
              <a href="mailto:info@catussynergy.com" className="mb-8 flex items-start gap-3 text-sm text-slate-300 transition-colors hover:text-blue-300 sm:mb-0" data-testid="link-contact-email">
                <Mail size={16} className="mt-0.5 text-blue-400" /><span>info@catussynergy.com</span>
              </a>
              <a href="tel:09063412678" className="mb-8 flex items-start gap-3 text-sm text-slate-300 transition-colors hover:text-blue-300 sm:mb-0" data-testid="link-contact-phone">
                <Phone size={16} className="mt-0.5 text-blue-400" /><span>09063412678</span>
              </a>
              <div className="flex items-start gap-3 text-sm text-slate-300" data-testid="text-contact-social"><span className="mt-0.5 font-mono-brand text-[11px] text-blue-400">@</span><span>Catus_synergy</span></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-700/40 bg-[#050d18]">
        <div className="container-wide grid gap-10 px-5 py-10 lg:grid-cols-[1.2fr_.8fr_.8fr] lg:px-8">
          <div>
            <BrandWordmark />
            <p className="mt-5 max-w-[280px] text-sm leading-6 text-slate-500">Cooperative Attitude Towards Growth</p>
          </div>
          <div>
            <span className="eyebrow">Navigate</span>
            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">
              {navItems.map(([label, href]) => <a key={label} href={href} className="font-mono-brand text-[10px] uppercase tracking-[.12em] text-slate-400 transition-colors hover:text-white" data-testid={`link-footer-${label.toLowerCase()}`}>{label}</a>)}
            </div>
          </div>
          <div>
            <span className="eyebrow">Contact</span>
            <div className="mt-5 space-y-3 text-sm text-slate-400">
              <a href="mailto:info@catussynergy.com" className="block transition-colors hover:text-blue-300" data-testid="link-footer-email">info@catussynergy.com</a>
              <a href="tel:09063412678" className="block transition-colors hover:text-blue-300" data-testid="link-footer-phone">09063412678</a>
              <span className="block">@Catus_synergy</span>
            </div>
          </div>
        </div>
        <div className="container-wide flex flex-col gap-3 border-t border-slate-700/40 px-5 py-5 font-mono-brand text-[9px] uppercase tracking-[.14em] text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} Catus Synergy Limited</span>
          <span>A company that moves.</span>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;