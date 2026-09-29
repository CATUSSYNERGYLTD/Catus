import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

const navItems = [
  ['Home', '#home'],
  ['About Us', '#about'],
  ['Our Services', '#services'],
  ['Our Businesses', '#businesses'],
  ['Projects', '#work'],
  ['Partners', '#partners'],
  ['Contact', '#contact'],
];

const services = [
  { title: 'Real Estate & Construction', kicker: 'Built for lasting value', description: 'Creating considered spaces and supporting the construction work that gives communities room to grow.', image: '/images/catus-real-estate.jpg' },
  { title: 'Environmental Management', kicker: 'Stewarding the places we share', description: 'Practical environmental thinking for cleaner, more resilient spaces and responsible operations.', image: '/images/catus-environment.jpg' },
  { title: 'Property Management', kicker: 'Care beyond handover', description: 'Disciplined oversight that keeps properties useful, welcoming and ready for the people who rely on them.', image: '/images/catus-property-management.jpg' },
  { title: 'Import & Export', kicker: 'Moving value across borders', description: 'Connecting markets through dependable trade coordination and a clear view of the details.', image: '/images/catus-import-export.jpg' },
  { title: 'Consultancy', kicker: 'Clarity for the next decision', description: 'Collaborative insight for organisations navigating opportunity, complexity and change.', image: '/images/catus-consultancy.jpg' },
  { title: 'Cleaning Services', kicker: 'The standard is in the detail', description: 'Thoughtful, professional cleaning that makes workplaces and shared environments feel cared for.', image: '/images/catus-cleaning-services.jpg' },
];

const slides = services.map((service, index) => ({
  ...service,
  eyebrow: `Business area / 0${index + 1}`,
  headline: [
    ['Building spaces.', 'Creating value.'],
    ['Responsible work.', 'Healthier places.'],
    ['Managing well.', 'Making room.'],
    ['Moving value.', 'Connecting markets.'],
    ['Better decisions.', 'Shared direction.'],
    ['Care in motion.', 'Standards that show.'],
  ][index],
}));

const approach = [
  ['01', 'UNDERSTAND', 'We listen closely to the context, the people and the opportunity in front of us.'],
  ['02', 'PLAN', 'We bring structure to the path ahead with clear thinking and practical priorities.'],
  ['03', 'EXECUTE', 'We move from intention to action with care, discipline and accountability.'],
  ['04', 'GROW', 'We learn, improve and build the relationships that make progress durable.'],
];

function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/brand/catus-synergy-wordmark-cropped.png"
      alt="Catus Synergy Limited"
      className={compact ? 'wordmark-crop h-11 w-[120px]' : 'wordmark-crop h-14 w-[140px]'}
      data-testid={compact ? 'img-wordmark-header' : 'img-wordmark-footer'}
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
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {navItems.map(([label, href]) => (
            <a key={label} href={href} className="font-mono-brand text-[10px] uppercase tracking-[.12em] text-[#343746] transition-colors hover:text-[#0000ad]" data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>
          ))}
        </nav>
        <a href="#contact" className="hidden items-center gap-2 rounded-full bg-[#0000ad] px-5 py-3 font-mono-brand text-[10px] uppercase tracking-[.12em] text-white transition-transform hover:-translate-y-0.5 lg:flex" data-testid="link-header-conversation">
          Let&apos;s talk <ArrowUpRight size={14} />
        </a>
        <button type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0000ad] text-[#0000ad] lg:hidden" data-testid="button-mobile-menu">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {menuOpen && (
        <nav className="border-t border-black/10 bg-[#f7f5ef] px-5 py-4 lg:hidden" aria-label="Mobile navigation">
          {navItems.map(([label, href], index) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-black/10 py-4 font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#202331]" data-testid={`link-mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <span>{String(index + 1).padStart(2, '0')} / {label}</span><ArrowUpRight size={14} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const slide = slides[active];
  const next = () => setActive((current) => (current + 1) % slides.length);
  const previous = () => setActive((current) => (current - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(next, 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section id="home" className="relative flex min-h-[min(860px,100dvh)] items-end overflow-hidden bg-[#111426] text-white" aria-roledescription="carousel" aria-label="Catus Synergy business areas">
      <div className="absolute inset-0">
        {slides.map((item, index) => (
          <img
            key={item.image}
            src={item.image}
            alt=""
            aria-hidden="true"
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'low'}
            className={`hero-image absolute inset-0 h-full w-full object-cover ${active === index ? 'hero-image--active' : ''}`}
          />
        ))}
        <div className="hero-shade absolute inset-0" />
      </div>
      <div className="hero-watermark" aria-hidden="true">Catus Synergy</div>
      <div className="container-wide relative z-10 w-full px-5 pb-24 pt-36 lg:px-8 lg:pb-28">
        <div className="max-w-[780px] hero-copy-enter" key={active}>
          <div className="mb-7 flex items-center gap-4">
            <span className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-white/75">{slide.eyebrow}</span>
            <span className="h-px w-20 bg-white/45" />
            <span className="font-mono-brand text-[10px] tracking-[.18em] text-white/65">LAGOS / NIGERIA</span>
          </div>
          <p className="mb-6 max-w-[400px] text-base leading-7 text-white/80" data-testid="text-hero-description">{slide.description}</p>
          <h1 className="display max-w-[800px] text-[clamp(3.4rem,8vw,8.6rem)] font-medium" data-testid="text-hero-headline">{slide.headline[0]}<br /><em className="text-[#b8c8ff]">{slide.headline[1]}</em></h1>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#services" className="group inline-flex items-center justify-between gap-9 rounded-full bg-white px-6 py-4 font-mono-brand text-[10px] uppercase tracking-[.13em] text-[#0000ad] transition-transform hover:-translate-y-1" data-testid="link-hero-services">Explore our services <ArrowDownRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1" /></a>
            <a href="#contact" className="group inline-flex items-center justify-between gap-9 rounded-full border border-white/55 px-6 py-4 font-mono-brand text-[10px] uppercase tracking-[.13em] text-white transition-colors hover:border-white hover:bg-white/10" data-testid="link-hero-contact">Contact us <ArrowDownRight size={16} /></a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-7 right-4 z-10 flex items-center gap-2.5 sm:right-5 sm:gap-4 lg:right-8">
        <button type="button" onClick={previous} aria-label="Previous business area" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white transition-colors hover:bg-white hover:text-[#0000ad] sm:h-10 sm:w-10" data-testid="button-slide-previous"><ArrowLeft size={16} /></button>
        <div className="flex items-center gap-1.5" role="group" aria-label="Choose a business area">
          {slides.map((item, index) => <button type="button" key={item.title} aria-label={`Show ${item.title}`} aria-current={active === index ? 'true' : undefined} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${active === index ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} data-testid={`button-slide-${index}`} />)}
        </div>
        <button type="button" onClick={next} aria-label="Next business area" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white transition-colors hover:bg-white hover:text-[#0000ad] sm:h-10 sm:w-10" data-testid="button-slide-next"><ArrowRight size={16} /></button>
        <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play business slideshow' : 'Pause business slideshow'} className="font-mono-brand text-[9px] uppercase tracking-[.13em] text-white/75" data-testid="button-slide-pause">{paused ? 'Play' : 'Pause'}</button>
      </div>
      <div className="absolute bottom-7 left-5 z-10 hidden font-mono-brand text-[10px] uppercase tracking-[.16em] text-white/70 sm:block lg:left-8">Cooperative attitude towards growth</div>
    </section>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBusiness, setActiveBusiness] = useState(0);

  useEffect(() => {
    document.title = 'Catus Synergy Limited — Cooperative Attitude Towards Growth';
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-reveal]'));
    if (!('IntersectionObserver' in window)) { reveals.forEach((item) => item.classList.add('is-in-view')); return; }
    document.documentElement.classList.add('scroll-reveal-ready');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in-view'); observer.unobserve(entry.target); } }), { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((item) => observer.observe(item));
    return () => { observer.disconnect(); document.documentElement.classList.remove('scroll-reveal-ready'); };
  }, []);

  const selectedService = useMemo(() => services[activeBusiness], [activeBusiness]);

  return (
    <div className="site-shell min-h-[100dvh]">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        <Hero />

        <section id="about" className="section-pad" aria-labelledby="about-title">
          <div className="container-wide grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-24" data-scroll-reveal>
            <div>
              <span className="eyebrow">01 / Who we are</span>
              <div className="mt-7 h-px w-20 bg-[#0000ad]" />
              <p className="mt-8 max-w-[220px] text-sm leading-6 text-[#636675]">A Nigerian parent company with a practical view of progress: build well, connect people and manage with care.</p>
            </div>
            <div>
              <h2 id="about-title" className="display max-w-[850px] text-[clamp(3.2rem,7vw,7.5rem)] font-medium text-[#141827]">Different strengths.<br /><em className="text-[#0000ad]">One direction.</em></h2>
              <div className="mt-10 grid gap-8 border-t border-black/15 pt-7 sm:grid-cols-[1.2fr_.8fr]">
                <p className="text-xl leading-8 text-[#303340]">Catus Synergy Limited is a diversified parent company building, managing and connecting ventures, services and opportunities for sustainable growth.</p>
                <div>
                  <p className="text-sm leading-7 text-[#636675]">Our work spans six business areas, each with its own expertise and a shared commitment to practical outcomes. We make room for good work and meaningful partnerships.</p>
                  <a href="#businesses" className="mt-6 inline-flex items-center gap-3 font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#0000ad]" data-testid="link-about-businesses">Discover our businesses <ArrowUpRight size={14} /></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="section-pad bg-[#eeece5]" aria-labelledby="services-title">
          <div className="container-wide" data-scroll-reveal>
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div><span className="eyebrow">02 / What we do</span><h2 id="services-title" className="display mt-6 text-[clamp(3.3rem,7vw,7rem)] font-medium text-[#141827]">Our <em className="text-[#0000ad]">services.</em></h2></div>
              <p className="max-w-[300px] text-sm leading-6 text-[#636675]">Illustrative sector photography helps introduce the breadth of our work. It does not represent Catus Synergy project records.</p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <article key={service.title} className="service-card group overflow-hidden rounded-[2px] bg-white" data-testid={`card-service-${index}`}>
                  <div className="relative aspect-[1.08] overflow-hidden"><img src={service.image} alt="" loading="lazy" className="h-full w-full object-cover" /><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 font-mono-brand text-[9px] tracking-[.12em] text-[#0000ad]">0{index + 1}</span></div>
                  <div className="p-6"><p className="font-mono-brand text-[9px] uppercase tracking-[.14em] text-[#0000ad]">{service.kicker}</p><h3 className="mt-3 text-2xl font-semibold tracking-[-.04em] text-[#151925]">{service.title}</h3><p className="mt-3 text-sm leading-6 text-[#636675]">{service.description}</p><a href="#contact" className="mt-6 inline-flex items-center gap-3 font-mono-brand text-[10px] uppercase tracking-[.13em] text-[#0000ad]" data-testid={`link-service-contact-${index}`}>Discuss this area <ArrowUpRight size={14} /></a></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="businesses" className="section-pad blue-panel text-white" aria-labelledby="businesses-title">
          <div className="container-wide grid gap-14 lg:grid-cols-[.78fr_1.22fr] lg:gap-24" data-scroll-reveal>
            <div><span className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-[#b8c8ff]">03 / Our businesses</span><h2 id="businesses-title" className="display mt-7 text-[clamp(3.3rem,7vw,7rem)] font-medium">Six areas.<br /><em className="text-[#b8c8ff]">Shared momentum.</em></h2></div>
            <div>
              <div className="border-t border-white/25">
                {services.map((service, index) => <button type="button" key={service.title} onClick={() => setActiveBusiness(index)} aria-pressed={activeBusiness === index} className={`flex w-full items-center gap-4 border-b border-white/25 py-5 text-left transition-colors ${activeBusiness === index ? 'bg-white/10' : 'hover:bg-white/5'}`} data-testid={`button-business-${index}`}><span className="w-8 font-mono-brand text-[10px] text-[#b8c8ff]">0{index + 1}</span><span className={`text-[clamp(1.15rem,2.4vw,2rem)] tracking-[-.04em] ${activeBusiness === index ? 'text-white' : 'text-white/65'}`}>{service.title}</span><ArrowUpRight size={17} className="ml-auto text-[#b8c8ff]" /></button>)}
              </div>
              <div className="mt-7 grid gap-5 border border-white/20 p-5 sm:grid-cols-[.6fr_1.4fr] sm:p-7"><div><span className="font-mono-brand text-[9px] uppercase tracking-[.14em] text-[#b8c8ff]">Selected area</span><p className="mt-3 text-xl" data-testid="text-selected-business">{selectedService.title}</p></div><p className="text-sm leading-7 text-white/70">{selectedService.description}</p></div>
            </div>
          </div>
        </section>

        <section id="work" className="section-pad" aria-labelledby="work-title">
          <div className="container-wide" data-scroll-reveal>
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><span className="eyebrow">04 / Our work</span><h2 id="work-title" className="display mt-6 text-[clamp(3.2rem,7vw,7rem)] font-medium">A view of<br /><em className="text-[#0000ad]">possibility.</em></h2></div><p className="max-w-[320px] text-sm leading-6 text-[#636675]">These visual stories are illustrative sector views, not a list of Catus Synergy client projects or claims.</p></div>
            <div className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              <article className="project-card group relative min-h-[500px] overflow-hidden bg-[#12162a]"><img src="/images/catus-real-estate.jpg" alt="Modern mixed-use property" className="absolute inset-0 h-full w-full object-cover opacity-80" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-[#0b0d1a] via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-7 text-white"><span className="font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#b8c8ff]">Illustrative sector view / built environment</span><h3 className="mt-3 text-3xl tracking-[-.04em]">Spaces that carry life forward.</h3><p className="mt-3 max-w-[440px] text-sm leading-6 text-white/70">A considered view of the places and possibilities within real estate and construction.</p></div></article>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1"><article className="project-card group relative min-h-[240px] overflow-hidden bg-[#12162a]"><img src="/images/catus-environment.jpg" alt="Environmental management by a canal" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /><div className="absolute inset-0 bg-[#061531]/45" /><div className="absolute inset-x-0 bottom-0 p-6 text-white"><span className="font-mono-brand text-[9px] uppercase tracking-[.14em] text-[#b8c8ff]">Environment</span><h3 className="mt-2 text-2xl tracking-[-.04em]">Places worth caring for.</h3></div></article><article className="project-card group relative min-h-[240px] overflow-hidden bg-[#12162a]"><img src="/images/catus-import-export.jpg" alt="Cargo ship at a port" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /><div className="absolute inset-0 bg-[#061531]/45" /><div className="absolute inset-x-0 bottom-0 p-6 text-white"><span className="font-mono-brand text-[9px] uppercase tracking-[.14em] text-[#b8c8ff]">Trade</span><h3 className="mt-2 text-2xl tracking-[-.04em]">Connection is a form of value.</h3></div></article></div>
            </div>
          </div>
        </section>

        <section id="approach" className="section-pad bg-[#eeece5]" aria-labelledby="approach-title">
          <div className="container-wide" data-scroll-reveal><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24"><div><span className="eyebrow">05 / Our approach</span><h2 id="approach-title" className="display mt-7 text-[clamp(3.3rem,7vw,7rem)] font-medium text-[#141827]">Make progress<br /><em className="text-[#0000ad]">make sense.</em></h2></div><div><p className="max-w-[540px] text-xl leading-8 text-[#303340]">We turn a cooperative attitude into a repeatable way of working. Clear enough to move quickly, thoughtful enough to last.</p><div className="mt-14 grid border-t border-black/15 md:grid-cols-4">{approach.map(([number, title, copy]) => <article key={title} className="border-b border-black/15 py-6 md:min-h-[290px] md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"><span className="font-mono-brand text-[10px] text-[#0000ad]">{number}</span><h3 className="mt-16 text-2xl font-semibold tracking-[-.04em] text-[#141827]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#636675]">{copy}</p></article>)}</div></div></div></div>
        </section>

        <section id="partners" className="section-pad-tight overflow-hidden" aria-labelledby="partners-title">
          <div className="container-wide" data-scroll-reveal><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><span className="eyebrow">06 / Trusted by</span><h2 id="partners-title" className="display mt-6 text-[clamp(3rem,6vw,6rem)] font-medium">Partnership<br /><em className="text-[#0000ad]">starts with trust.</em></h2></div><p className="max-w-[320px] text-sm leading-6 text-[#636675]" data-testid="text-partner-availability">Verified partner and client names or logos have not been supplied for publication.</p></div><div className="partner-strip mt-14 border-y border-black/10 py-5"><div className="flex items-center gap-4"><span className="h-1.5 w-1.5 rounded-full bg-[#0000ad]" /><span className="font-mono-brand text-[10px] uppercase tracking-[.15em] text-[#636675]">Partner and client logos can be added when verified assets are available.</span></div></div></div>
        </section>

        <section className="section-pad-tight blue-panel text-white" aria-labelledby="why-title"><div className="container-wide grid gap-12 lg:grid-cols-[.65fr_1.35fr] lg:gap-24" data-scroll-reveal><div><span className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-[#b8c8ff]">07 / Why Catus Synergy</span><h2 id="why-title" className="display mt-7 text-[clamp(3rem,6.5vw,6.8rem)] font-medium">Cooperative<br /><em className="text-[#b8c8ff]">attitude.</em></h2></div><div><p className="max-w-[650px] text-[clamp(1.35rem,2.8vw,2.3rem)] leading-[1.25] tracking-[-.04em]">Growth is more useful when it is shared. We bring together collaboration, professionalism, innovation, partnership, people and growth.</p><div className="mt-12 grid gap-0 border-t border-white/25 sm:grid-cols-3">{['Collaboration', 'Professionalism', 'Innovation', 'Partnership', 'People', 'Growth'].map((item, index) => <div key={item} className="flex items-center gap-3 border-b border-white/25 py-4"><Check size={14} className="text-[#b8c8ff]" /><span className="text-sm text-white/80">{item}</span><span className="ml-auto font-mono-brand text-[9px] text-white/45">0{index + 1}</span></div>)}</div></div></div></section>

        <section id="leadership" className="section-pad" aria-labelledby="leadership-title"><div className="container-wide grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24" data-scroll-reveal><div><span className="eyebrow">08 / Leadership</span><h2 id="leadership-title" className="display mt-7 text-[clamp(3.2rem,6vw,6rem)] font-medium">A steady<br /><em className="text-[#0000ad]">point of view.</em></h2></div><div className="border-t border-black/15 pt-7"><div className="grid gap-8 sm:grid-cols-[180px_1fr] sm:items-start"><div className="flex aspect-square items-center justify-center bg-[#0000ad] text-center text-white"><span className="font-mono-brand text-[10px] uppercase leading-5 tracking-[.13em]">Portrait<br />to be<br />added</span></div><div><p className="font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#0000ad]">Chief Executive Officer</p><h3 className="mt-4 text-3xl font-semibold tracking-[-.05em] text-[#141827]">Ernest Ihejirika Nwachukwu</h3><p className="mt-5 max-w-[490px] text-sm leading-7 text-[#636675]">Cooperative Attitude Towards Growth is the company’s guiding message, supported by collaboration, professionalism, innovation, partnership, people and growth.</p></div></div></div></div></section>

        <section id="contact" className="section-pad blue-panel text-white" aria-labelledby="contact-title"><div className="container-wide" data-scroll-reveal><span className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-[#b8c8ff]">09 / Start a conversation</span><div className="mt-8 flex flex-col justify-between gap-12 lg:flex-row lg:items-end"><h2 id="contact-title" className="display max-w-[850px] text-[clamp(3.2rem,8vw,8.3rem)] font-medium">Let&apos;s build something <em className="text-[#b8c8ff]">meaningful.</em></h2><a href="mailto:info@catussynergy.com" className="group inline-flex shrink-0 items-center gap-5 rounded-full bg-white px-6 py-4 font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#0000ad] transition-transform hover:-translate-y-1" data-testid="link-start-conversation">Get in touch <ArrowUpRight size={16} /></a></div><div className="mt-20 grid gap-8 border-t border-white/25 pt-8 sm:grid-cols-2 lg:grid-cols-4"><a href="https://maps.google.com/?q=Lagos,Nigeria" target="_blank" rel="noreferrer" className="flex items-start gap-3 text-sm text-white/80 transition-colors hover:text-white" data-testid="link-contact-location"><MapPin size={16} className="mt-0.5 text-[#b8c8ff]" /><span>Lagos, Nigeria</span></a><a href="mailto:info@catussynergy.com" className="flex items-start gap-3 text-sm text-white/80 transition-colors hover:text-white" data-testid="link-contact-email"><Mail size={16} className="mt-0.5 text-[#b8c8ff]" /><span>info@catussynergy.com</span></a><a href="tel:09063412678" className="flex items-start gap-3 text-sm text-white/80 transition-colors hover:text-white" data-testid="link-contact-phone"><Phone size={16} className="mt-0.5 text-[#b8c8ff]" /><span>09063412678</span></a><span className="flex items-start gap-3 text-sm text-white/80" data-testid="text-contact-social"><span className="font-mono-brand text-[#b8c8ff]">@</span><span>Catus_synergy</span></span></div></div></section>
      </main>
      <footer className="bg-[#111426] text-white"><div className="container-wide grid gap-10 px-5 py-12 lg:grid-cols-[1.2fr_.8fr_.8fr] lg:px-8"><div><BrandWordmark /><p className="mt-5 max-w-[280px] text-sm leading-6 text-white/50">Cooperative Attitude Towards Growth</p></div><div><span className="font-mono-brand text-[10px] uppercase tracking-[.16em] text-[#b8c8ff]">Navigate</span><div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">{navItems.map(([label, href]) => <a key={label} href={href} className="font-mono-brand text-[10px] uppercase tracking-[.12em] text-white/60 transition-colors hover:text-white" data-testid={`link-footer-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>)}</div></div><div><span className="font-mono-brand text-[10px] uppercase tracking-[.16em] text-[#b8c8ff]">Contact</span><div className="mt-5 space-y-3 text-sm text-white/60"><a href="mailto:info@catussynergy.com" className="block hover:text-white" data-testid="link-footer-email">info@catussynergy.com</a><a href="tel:09063412678" className="block hover:text-white" data-testid="link-footer-phone">09063412678</a><span className="block">@Catus_synergy</span></div></div></div><div className="container-wide flex flex-col gap-3 border-t border-white/10 px-5 py-5 font-mono-brand text-[9px] uppercase tracking-[.14em] text-white/40 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© {new Date().getFullYear()} Catus Synergy Limited</span><span>Cooperative attitude towards growth</span></div></footer>
    </div>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;