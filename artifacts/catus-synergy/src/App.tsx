import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { useGetSiteContent, type SiteContent } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import AdminPage from '@/pages/admin';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { defaultSiteContent } from '@/lib/default-site-content';

const queryClient = new QueryClient();

function safeHref(value: string, fallback = '#'): string {
  if (value.startsWith('#') || (value.startsWith('/') && !value.startsWith('//'))) return value;
  try {
    const parsed = new URL(value);
    return ['https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? value : fallback;
  } catch {
    return fallback;
  }
}

function safeImageSrc(value: string): string | undefined {
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    return new URL(value).protocol === 'https:' ? value : undefined;
  } catch {
    return undefined;
  }
}

function BrandWordmark({ compact = false, src, companyName }: { compact?: boolean; src: string; companyName: string }) {
  return (
    <img
      src={safeImageSrc(src) ?? defaultSiteContent.brand.logoPath}
      alt={companyName}
      className={compact ? 'wordmark-crop h-11 w-[120px]' : 'wordmark-crop h-14 w-[140px]'}
      data-testid={compact ? 'img-wordmark-header' : 'img-wordmark-footer'}
    />
  );
}

function Header({ content, menuOpen, setMenuOpen }: { content: SiteContent; menuOpen: boolean; setMenuOpen: (open: boolean) => void }) {
  return (
    <header className="nav-glass fixed inset-x-0 top-0 z-50">
      <div className="container-wide flex h-[76px] items-center justify-between px-5 lg:px-8">
        <a href="#home" className="flex items-center" aria-label="Catus Synergy home" onClick={() => setMenuOpen(false)} data-testid="link-home-logo">
          <BrandWordmark compact src={content.brand.logoPath} companyName={content.brand.companyName} />
        </a>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {content.navigation.map(({ label, href }, index) => (
            <a key={`${label}-${index}`} href={safeHref(href)} className="font-mono-brand text-[10px] uppercase tracking-[.12em] text-[#343746] transition-colors hover:text-[#0000ad]" data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>
          ))}
        </nav>
        <a href="#contact" className="hidden items-center gap-2 rounded-full bg-[#0000ad] px-5 py-3 font-mono-brand text-[10px] uppercase tracking-[.12em] text-white transition-transform hover:-translate-y-0.5 lg:flex" data-testid="link-header-conversation">
          {content.headerCta} <ArrowUpRight size={14} />
        </a>
        <button type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#0000ad] text-[#0000ad] lg:hidden" data-testid="button-mobile-menu">
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {menuOpen && (
        <nav className="border-t border-black/10 bg-[#f7f5ef] px-5 py-4 lg:hidden" aria-label="Mobile navigation">
          {content.navigation.map(({ label, href }, index) => (
            <a key={`${label}-${index}`} href={safeHref(href)} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-black/10 py-4 font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#202331]" data-testid={`link-mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <span>{String(index + 1).padStart(2, '0')} / {label}</span><ArrowUpRight size={14} />
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Hero({ content, companyName }: { content: SiteContent['hero']; companyName: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const slides = content.slides.length ? content.slides : defaultSiteContent.hero.slides;
  const slide = slides[Math.min(active, slides.length - 1)];
  const next = () => setActive((current) => (current + 1) % slides.length);
  const previous = () => setActive((current) => (current - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(next, 6500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  return (
      <section id="home" className="relative flex min-h-[min(860px,100dvh)] items-end overflow-hidden bg-[#111426] text-white" aria-roledescription="carousel" aria-label={`${companyName} business areas`}>
      <div className="absolute inset-0">
        {slides.map((item, index) => (
          <img
              key={`${item.image}-${index}`}
              src={safeImageSrc(item.image) ?? defaultSiteContent.hero.slides[index % defaultSiteContent.hero.slides.length].image}
            alt=""
            aria-hidden="true"
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : 'low'}
            className={`hero-image absolute inset-0 h-full w-full object-cover ${active === index ? 'hero-image--active' : ''}`}
          />
        ))}
        <div className="hero-shade absolute inset-0" />
      </div>
        <div className="hero-watermark" aria-hidden="true">{content.watermark}</div>
      <div className="container-wide relative z-10 w-full px-5 pb-24 pt-36 lg:px-8 lg:pb-28">
        <div className="max-w-[780px] hero-copy-enter" key={active}>
          <div className="mb-7 flex items-center gap-4">
            <span className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-white/75">{slide.eyebrow}</span>
            <span className="h-px w-20 bg-white/45" />
            <span className="font-mono-brand text-[10px] tracking-[.18em] text-white/65">{content.locationLabel}</span>
          </div>
          <p className="mb-6 max-w-[400px] text-base leading-7 text-white/80" data-testid="text-hero-description">{slide.description}</p>
          <h1 className="display max-w-[800px] text-[clamp(3.4rem,8vw,8.6rem)] font-medium" data-testid="text-hero-headline">{slide.headlineFirst}<br /><em className="text-[#b8c8ff]">{slide.headlineSecond}</em></h1>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#services" className="group inline-flex items-center justify-between gap-9 rounded-full bg-white px-6 py-4 font-mono-brand text-[10px] uppercase tracking-[.13em] text-[#0000ad] transition-transform hover:-translate-y-1" data-testid="link-hero-services">{content.primaryCta} <ArrowDownRight size={16} className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1" /></a>
            <a href="#contact" className="group inline-flex items-center justify-between gap-9 rounded-full border border-white/55 px-6 py-4 font-mono-brand text-[10px] uppercase tracking-[.13em] text-white transition-colors hover:border-white hover:bg-white/10" data-testid="link-hero-contact">{content.secondaryCta} <ArrowDownRight size={16} /></a>
          </div>
        </div>
      </div>
      <div className="absolute bottom-7 right-4 z-10 flex items-center gap-2.5 sm:right-5 sm:gap-4 lg:right-8">
        <button type="button" onClick={previous} aria-label="Previous business area" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white transition-colors hover:bg-white hover:text-[#0000ad] sm:h-10 sm:w-10" data-testid="button-slide-previous"><ArrowLeft size={16} /></button>
        <div className="flex items-center gap-1.5" role="group" aria-label="Choose a business area">
          {slides.map((item, index) => <button type="button" key={`${item.eyebrow}-${index}`} aria-label={`Show ${item.headlineFirst}`} aria-current={active === index ? 'true' : undefined} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${active === index ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} data-testid={`button-slide-${index}`} />)}
        </div>
        <button type="button" onClick={next} aria-label="Next business area" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white transition-colors hover:bg-white hover:text-[#0000ad] sm:h-10 sm:w-10" data-testid="button-slide-next"><ArrowRight size={16} /></button>
        <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play business slideshow' : 'Pause business slideshow'} className="font-mono-brand text-[9px] uppercase tracking-[.13em] text-white/75" data-testid="button-slide-pause">{paused ? content.playLabel : content.pauseLabel}</button>
      </div>
      <div className="absolute bottom-7 left-5 z-10 hidden font-mono-brand text-[10px] uppercase tracking-[.16em] text-white/70 sm:block lg:left-8">{content.footerLabel}</div>
    </section>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeBusiness, setActiveBusiness] = useState(0);
  const { data: siteSnapshot, isError: contentLoadError } = useGetSiteContent();
  const content: SiteContent = siteSnapshot?.content ?? defaultSiteContent;
  const services = content.services.items;
  const businesses = content.businesses.items;
  const approach = content.approach.steps;
  const navItems = content.navigation;
  const selectedBusiness = businesses[activeBusiness] ?? businesses[0];

  useEffect(() => {
    document.title = `${content.brand.companyName} — ${content.brand.tagline}`;
  }, [content.brand.companyName, content.brand.tagline]);

  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-reveal]'));
    if (!('IntersectionObserver' in window)) { reveals.forEach((item) => item.classList.add('is-in-view')); return; }
    document.documentElement.classList.add('scroll-reveal-ready');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in-view'); observer.unobserve(entry.target); } }), { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((item) => observer.observe(item));
    return () => { observer.disconnect(); document.documentElement.classList.remove('scroll-reveal-ready'); };
  }, []);

  return (
    <div className="site-shell min-h-[100dvh]">
      <Header content={content} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        {contentLoadError && <div className="bg-[#fff3cd] px-5 py-3 text-center text-sm text-[#493c17]" role="status">The latest site updates could not be loaded. Showing the original website content.</div>}
        <Hero content={content.hero} companyName={content.brand.companyName} />

        <section id="about" className="section-pad" aria-labelledby="about-title">
          <div className="container-wide grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-24" data-scroll-reveal>
            <div>
              <span className="eyebrow">{content.about.eyebrow}</span>
              <div className="mt-7 h-px w-20 bg-[#0000ad]" />
              <p className="mt-8 max-w-[220px] text-sm leading-6 text-[#636675]">{content.about.leftNote}</p>
            </div>
            <div>
              <h2 id="about-title" className="display max-w-[850px] text-[clamp(3.2rem,7vw,7.5rem)] font-medium text-[#141827]">{content.about.titleFirst}<br /><em className="text-[#0000ad]">{content.about.titleSecond}</em></h2>
              <div className="mt-10 grid gap-8 border-t border-black/15 pt-7 sm:grid-cols-[1.2fr_.8fr]">
                <p className="text-xl leading-8 text-[#303340]">{content.about.body}</p>
                <div>
                  <p className="text-sm leading-7 text-[#636675]">{content.about.supportingCopy}</p>
                  <a href="#businesses" className="mt-6 inline-flex items-center gap-3 font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#0000ad]" data-testid="link-about-businesses">{content.about.cta} <ArrowUpRight size={14} /></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="section-pad bg-[#eeece5]" aria-labelledby="services-title">
          <div className="container-wide" data-scroll-reveal>
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div><span className="eyebrow">{content.services.eyebrow}</span><h2 id="services-title" className="display mt-6 text-[clamp(3.3rem,7vw,7rem)] font-medium text-[#141827]">{content.services.title} <em className="text-[#0000ad]">{content.services.titleEmphasis}</em></h2></div>
              <p className="max-w-[300px] text-sm leading-6 text-[#636675]">{content.services.note}</p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <article key={service.title} className="service-card group overflow-hidden rounded-[2px] bg-white" data-testid={`card-service-${index}`}>
                  <div className="relative aspect-[1.08] overflow-hidden">{safeImageSrc(service.image) && <img src={safeImageSrc(service.image)} alt="" loading="lazy" className="h-full w-full object-cover" />}<span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-2 font-mono-brand text-[9px] tracking-[.12em] text-[#0000ad]">0{index + 1}</span></div>
                  <div className="p-6"><p className="font-mono-brand text-[9px] uppercase tracking-[.14em] text-[#0000ad]">{service.kicker}</p><h3 className="mt-3 text-2xl font-semibold tracking-[-.04em] text-[#151925]">{service.title}</h3><p className="mt-3 text-sm leading-6 text-[#636675]">{service.description}</p><a href="#contact" className="mt-6 inline-flex items-center gap-3 font-mono-brand text-[10px] uppercase tracking-[.13em] text-[#0000ad]" data-testid={`link-service-contact-${index}`}>Discuss this area <ArrowUpRight size={14} /></a></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="businesses" className="section-pad blue-panel text-white" aria-labelledby="businesses-title">
          <div className="container-wide grid gap-14 lg:grid-cols-[.78fr_1.22fr] lg:gap-24" data-scroll-reveal>
            <div><span className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-[#b8c8ff]">{content.businesses.eyebrow}</span><h2 id="businesses-title" className="display mt-7 text-[clamp(3.3rem,7vw,7rem)] font-medium">{content.businesses.title}<br /><em className="text-[#b8c8ff]">{content.businesses.titleEmphasis}</em></h2></div>
            <div>
              <div className="border-t border-white/25">
                {businesses.map((business, index) => <button type="button" key={`${business.title}-${index}`} onClick={() => setActiveBusiness(index)} aria-pressed={activeBusiness === index} className={`flex w-full items-center gap-4 border-b border-white/25 py-5 text-left transition-colors ${activeBusiness === index ? 'bg-white/10' : 'hover:bg-white/5'}`} data-testid={`button-business-${index}`}><span className="w-8 font-mono-brand text-[10px] text-[#b8c8ff]">0{index + 1}</span><span className={`text-[clamp(1.15rem,2.4vw,2rem)] tracking-[-.04em] ${activeBusiness === index ? 'text-white' : 'text-white/65'}`}>{business.title}</span><ArrowUpRight size={17} className="ml-auto text-[#b8c8ff]" /></button>)}
              </div>
              {selectedBusiness && <div className="mt-7 grid gap-5 border border-white/20 p-5 sm:grid-cols-[.6fr_1.4fr] sm:p-7"><div><span className="font-mono-brand text-[9px] uppercase tracking-[.14em] text-[#b8c8ff]">Selected area</span><p className="mt-3 text-xl" data-testid="text-selected-business">{selectedBusiness.title}</p></div><p className="text-sm leading-7 text-white/70">{selectedBusiness.description}</p></div>}
            </div>
          </div>
        </section>

        <section id="work" className="section-pad" aria-labelledby="work-title">
          <div className="container-wide" data-scroll-reveal>
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><span className="eyebrow">{content.projects.eyebrow}</span><h2 id="work-title" className="display mt-6 text-[clamp(3.2rem,7vw,7rem)] font-medium">{content.projects.title}<br /><em className="text-[#0000ad]">{content.projects.titleEmphasis}</em></h2></div><p className="max-w-[320px] text-sm leading-6 text-[#636675]">{content.projects.note}</p></div>
            <div className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              {content.projects.items.length === 0 ? <p className="text-sm text-[#636675]">No projects are currently published.</p> : content.projects.items.map((project, index) => (
                <article key={`${project.title}-${index}`} className={`project-card group relative min-h-[280px] overflow-hidden bg-[#12162a] ${index === 0 ? 'lg:col-span-2 lg:min-h-[500px]' : ''}`} data-testid={`card-project-${index}`}>
                  {safeImageSrc(project.image) && <img src={safeImageSrc(project.image)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d1a] via-[#0b0d1a]/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                    <span className="font-mono-brand text-[9px] uppercase tracking-[.14em] text-[#b8c8ff]">{project.illustrative ? 'Illustrative sector view / ' : ''}{project.category}{project.location ? ` / ${project.location}` : ''}</span>
                    <h3 className="mt-3 text-2xl tracking-[-.04em] sm:text-3xl">{project.title}</h3>
                    <p className="mt-3 max-w-[500px] text-sm leading-6 text-white/70">{project.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="approach" className="section-pad bg-[#eeece5]" aria-labelledby="approach-title">
          <div className="container-wide" data-scroll-reveal><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24"><div><span className="eyebrow">{content.approach.eyebrow}</span><h2 id="approach-title" className="display mt-7 text-[clamp(3.3rem,7vw,7rem)] font-medium text-[#141827]">{content.approach.title}<br /><em className="text-[#0000ad]">{content.approach.titleEmphasis}</em></h2></div><div><p className="max-w-[540px] text-xl leading-8 text-[#303340]">{content.approach.intro}</p><div className="mt-14 grid border-t border-black/15 md:grid-cols-4">{approach.map((step, index) => <article key={`${step.title}-${index}`} className="border-b border-black/15 py-6 md:min-h-[290px] md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"><span className="font-mono-brand text-[10px] text-[#0000ad]">{step.number}</span><h3 className="mt-16 text-2xl font-semibold tracking-[-.04em] text-[#141827]">{step.title}</h3><p className="mt-3 text-sm leading-6 text-[#636675]">{step.copy}</p></article>)}</div></div></div></div>
        </section>

        <section id="partners" className="section-pad-tight overflow-hidden" aria-labelledby="partners-title">
          <div className="container-wide" data-scroll-reveal>
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div><span className="eyebrow">{content.partners.eyebrow}</span><h2 id="partners-title" className="display mt-6 text-[clamp(3rem,6vw,6rem)] font-medium">{content.partners.title}<br /><em className="text-[#0000ad]">{content.partners.titleEmphasis}</em></h2></div>
              <p className="max-w-[320px] text-sm leading-6 text-[#636675]" data-testid="text-partner-availability">{content.partners.note}</p>
            </div>
            <div className="partner-strip mt-14 border-y border-black/10 py-5">
              {content.partners.items.length ? <div className="flex flex-wrap items-center gap-8" data-testid="list-partners">{content.partners.items.map((partner, index) => {
                const logo = safeImageSrc(partner.logo);
                const contents = logo ? <img src={logo} alt={partner.name} className="max-h-12 max-w-36 object-contain" loading="lazy" /> : <span className="font-semibold text-[#252938]">{partner.name}</span>;
                return partner.url ? <a key={`${partner.name}-${index}`} href={safeHref(partner.url)} target="_blank" rel="noreferrer" aria-label={partner.name} data-testid={`link-partner-${index}`}>{contents}</a> : <span key={`${partner.name}-${index}`} data-testid={`text-partner-${index}`}>{contents}</span>;
              })}</div> : <div className="flex items-center gap-4"><span className="h-1.5 w-1.5 rounded-full bg-[#0000ad]" /><span className="font-mono-brand text-[10px] uppercase tracking-[.15em] text-[#636675]" data-testid="text-partner-empty">{content.partners.emptyMessage}</span></div>}
            </div>
          </div>
        </section>

        <section className="section-pad-tight blue-panel text-white" aria-labelledby="why-title"><div className="container-wide grid gap-12 lg:grid-cols-[.65fr_1.35fr] lg:gap-24" data-scroll-reveal><div><span className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-[#b8c8ff]">{content.values.eyebrow}</span><h2 id="why-title" className="display mt-7 text-[clamp(3rem,6.5vw,6.8rem)] font-medium">{content.values.title}<br /><em className="text-[#b8c8ff]">{content.values.titleEmphasis}</em></h2></div><div><p className="max-w-[650px] text-[clamp(1.35rem,2.8vw,2.3rem)] leading-[1.25] tracking-[-.04em]">{content.values.intro}</p><div className="mt-12 grid gap-0 border-t border-white/25 sm:grid-cols-3">{content.values.items.map((item, index) => <div key={`${item}-${index}`} className="flex items-center gap-3 border-b border-white/25 py-4"><Check size={14} className="text-[#b8c8ff]" /><span className="text-sm text-white/80">{item}</span><span className="ml-auto font-mono-brand text-[9px] text-white/45">0{index + 1}</span></div>)}</div></div></div></section>

        <section id="leadership" className="section-pad" aria-labelledby="leadership-title"><div className="container-wide grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24" data-scroll-reveal><div><span className="eyebrow">{content.leadership.eyebrow}</span><h2 id="leadership-title" className="display mt-7 text-[clamp(3.2rem,6vw,6rem)] font-medium">{content.leadership.title}<br /><em className="text-[#0000ad]">{content.leadership.titleEmphasis}</em></h2></div><div className="border-t border-black/15 pt-7"><div className="grid gap-8 sm:grid-cols-[180px_1fr] sm:items-start"><div className="flex aspect-square items-center justify-center overflow-hidden bg-[#0000ad] text-center text-white">{safeImageSrc(content.leadership.portraitUrl) ? <img src={safeImageSrc(content.leadership.portraitUrl)} alt={content.leadership.name} className="h-full w-full object-cover" loading="lazy" /> : <span className="font-mono-brand text-[10px] uppercase leading-5 tracking-[.13em]">Portrait<br />to be<br />added</span>}</div><div><p className="font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#0000ad]">{content.leadership.role}</p><h3 className="mt-4 text-3xl font-semibold tracking-[-.05em] text-[#141827]">{content.leadership.name}</h3><p className="mt-5 max-w-[490px] text-sm leading-7 text-[#636675]">{content.leadership.statement}</p></div></div></div></div></section>

        <section id="contact" className="section-pad blue-panel text-white" aria-labelledby="contact-title"><div className="container-wide" data-scroll-reveal><span className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-[#b8c8ff]">{content.contact.eyebrow}</span><div className="mt-8 flex flex-col justify-between gap-12 lg:flex-row lg:items-end"><h2 id="contact-title" className="display max-w-[850px] text-[clamp(3.2rem,8vw,8.3rem)] font-medium">{content.contact.headline}</h2><a href={safeHref(`mailto:${content.contact.email}`)} className="group inline-flex shrink-0 items-center gap-5 rounded-full bg-white px-6 py-4 font-mono-brand text-[10px] uppercase tracking-[.14em] text-[#0000ad] transition-transform hover:-translate-y-1" data-testid="link-start-conversation">{content.contact.cta} <ArrowUpRight size={16} /></a></div><div className="mt-20 grid gap-8 border-t border-white/25 pt-8 sm:grid-cols-2 lg:grid-cols-4"><a href={`https://maps.google.com/?q=${encodeURIComponent(content.contact.location)}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 text-sm text-white/80 transition-colors hover:text-white" data-testid="link-contact-location"><MapPin size={16} className="mt-0.5 text-[#b8c8ff]" /><span>{content.contact.location}</span></a><a href={safeHref(`mailto:${content.contact.email}`)} className="flex items-start gap-3 text-sm text-white/80 transition-colors hover:text-white" data-testid="link-contact-email"><Mail size={16} className="mt-0.5 text-[#b8c8ff]" /><span>{content.contact.email}</span></a><a href={safeHref(`tel:${content.contact.phone.replace(/[^\d+]/g, '')}`)} className="flex items-start gap-3 text-sm text-white/80 transition-colors hover:text-white" data-testid="link-contact-phone"><Phone size={16} className="mt-0.5 text-[#b8c8ff]" /><span>{content.contact.phone}</span></a>{safeHref(content.contact.socialUrl, '') ? <a href={safeHref(content.contact.socialUrl, '')} target="_blank" rel="noreferrer" className="flex items-start gap-3 text-sm text-white/80 transition-colors hover:text-white" data-testid="link-contact-social"><span className="font-mono-brand text-[#b8c8ff]">@</span><span>{content.contact.socialHandle}</span></a> : <span className="flex items-start gap-3 text-sm text-white/80" data-testid="text-contact-social"><span className="font-mono-brand text-[#b8c8ff]">@</span><span>{content.contact.socialHandle}</span></span>}</div></div></section>
      </main>
      <footer className="bg-[#111426] text-white"><div className="container-wide grid gap-10 px-5 py-12 lg:grid-cols-[1.2fr_.8fr_.8fr] lg:px-8"><div><BrandWordmark src={content.brand.logoPath} companyName={content.brand.companyName} /><p className="mt-5 max-w-[280px] text-sm leading-6 text-white/50">{content.footer.tagline}</p></div><div><span className="font-mono-brand text-[10px] uppercase tracking-[.16em] text-[#b8c8ff]">{content.footer.navigateLabel}</span><div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">{navItems.map(({ label, href }, index) => <a key={`${label}-${index}`} href={safeHref(href)} className="font-mono-brand text-[10px] uppercase tracking-[.12em] text-white/60 transition-colors hover:text-white" data-testid={`link-footer-${label.toLowerCase().replaceAll(' ', '-')}`}>{label}</a>)}</div></div><div><span className="font-mono-brand text-[10px] uppercase tracking-[.16em] text-[#b8c8ff]">{content.footer.contactLabel}</span><div className="mt-5 space-y-3 text-sm text-white/60"><a href={safeHref(`mailto:${content.contact.email}`)} className="block hover:text-white" data-testid="link-footer-email">{content.contact.email}</a><a href={safeHref(`tel:${content.contact.phone.replace(/[^\d+]/g, '')}`)} className="block hover:text-white" data-testid="link-footer-phone">{content.contact.phone}</a><span className="block">@{content.contact.socialHandle}</span><a href="/admin" className="mt-3 inline-block font-mono-brand text-[9px] uppercase tracking-[.14em] text-white/35 hover:text-white/80" data-testid="link-footer-admin">Admin</a></div></div></div><div className="container-wide flex flex-col gap-3 border-t border-white/10 px-5 py-5 font-mono-brand text-[9px] uppercase tracking-[.14em] text-white/40 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© {new Date().getFullYear()} {content.brand.companyName}</span><span>{content.footer.tagline}</span></div></footer>
    </div>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/admin" component={AdminPage} /><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;