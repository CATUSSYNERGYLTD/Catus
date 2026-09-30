import type { SiteContent } from "@workspace/api-client-react";

export const defaultSiteContent: SiteContent = {
  brand: {
    companyName: "Catus Synergy Limited",
    tagline: "Cooperative Attitude Towards Growth",
    logoPath: "/brand/catus-synergy-wordmark-cropped.png",
  },
  navigation: [
    { label: "Home", href: "#home" },
    { label: "About Us", href: "#about" },
    { label: "Our Services", href: "#services" },
    { label: "Our Businesses", href: "#businesses" },
    { label: "Projects", href: "#work" },
    { label: "Partners", href: "#partners" },
    { label: "Contact", href: "#contact" },
  ],
  headerCta: "Let's talk",
  hero: {
    locationLabel: "LAGOS / NIGERIA",
    watermark: "Catus Synergy",
    footerLabel: "Cooperative attitude towards growth",
    primaryCta: "Explore our services",
    secondaryCta: "Contact us",
    pauseLabel: "Pause",
    playLabel: "Play",
    slides: [
      {
        eyebrow: "Business area / 01",
        headlineFirst: "Building spaces.",
        headlineSecond: "Creating value.",
        description:
          "Creating considered spaces and supporting the construction work that gives communities room to grow.",
        image: "/images/catus-real-estate.jpg",
      },
      {
        eyebrow: "Business area / 02",
        headlineFirst: "Responsible work.",
        headlineSecond: "Healthier places.",
        description:
          "Practical environmental thinking for cleaner, more resilient spaces and responsible operations.",
        image: "/images/catus-environment.jpg",
      },
      {
        eyebrow: "Business area / 03",
        headlineFirst: "Managing well.",
        headlineSecond: "Making room.",
        description:
          "Disciplined oversight that keeps properties useful, welcoming and ready for the people who rely on them.",
        image: "/images/catus-property-management.jpg",
      },
      {
        eyebrow: "Business area / 04",
        headlineFirst: "Moving value.",
        headlineSecond: "Connecting markets.",
        description:
          "Connecting markets through dependable trade coordination and a clear view of the details.",
        image: "/images/catus-import-export.jpg",
      },
      {
        eyebrow: "Business area / 05",
        headlineFirst: "Better decisions.",
        headlineSecond: "Shared direction.",
        description:
          "Collaborative insight for organisations navigating opportunity, complexity and change.",
        image: "/images/catus-consultancy.jpg",
      },
      {
        eyebrow: "Business area / 06",
        headlineFirst: "Care in motion.",
        headlineSecond: "Standards that show.",
        description:
          "Thoughtful, professional cleaning that makes workplaces and shared environments feel cared for.",
        image: "/images/catus-cleaning-services.jpg",
      },
    ],
  },
  about: {
    eyebrow: "01 / Who we are",
    leftNote:
      "A Nigerian parent company with a practical view of progress: build well, connect people and manage with care.",
    titleFirst: "Different strengths.",
    titleSecond: "One direction.",
    body: "Catus Synergy Limited is a diversified parent company building, managing and connecting ventures, services and opportunities for sustainable growth.",
    supportingCopy:
      "Our work spans six business areas, each with its own expertise and a shared commitment to practical outcomes. We make room for good work and meaningful partnerships.",
    cta: "Discover our businesses",
  },
  services: {
    eyebrow: "02 / What we do",
    title: "Our",
    titleEmphasis: "services.",
    note: "Illustrative sector photography helps introduce the breadth of our work. It does not represent Catus Synergy project records.",
    items: [
      {
        title: "Real Estate & Construction",
        kicker: "Built for lasting value",
        description:
          "Creating considered spaces and supporting the construction work that gives communities room to grow.",
        image: "/images/catus-real-estate.jpg",
      },
      {
        title: "Environmental Management",
        kicker: "Stewarding the places we share",
        description:
          "Practical environmental thinking for cleaner, more resilient spaces and responsible operations.",
        image: "/images/catus-environment.jpg",
      },
      {
        title: "Property Management",
        kicker: "Care beyond handover",
        description:
          "Disciplined oversight that keeps properties useful, welcoming and ready for the people who rely on them.",
        image: "/images/catus-property-management.jpg",
      },
      {
        title: "Import & Export",
        kicker: "Moving value across borders",
        description:
          "Connecting markets through dependable trade coordination and a clear view of the details.",
        image: "/images/catus-import-export.jpg",
      },
      {
        title: "Consultancy",
        kicker: "Clarity for the next decision",
        description:
          "Collaborative insight for organisations navigating opportunity, complexity and change.",
        image: "/images/catus-consultancy.jpg",
      },
      {
        title: "Cleaning Services",
        kicker: "The standard is in the detail",
        description:
          "Thoughtful, professional cleaning that makes workplaces and shared environments feel cared for.",
        image: "/images/catus-cleaning-services.jpg",
      },
    ],
  },
  businesses: {
    eyebrow: "03 / Our businesses",
    title: "Six areas.",
    titleEmphasis: "Shared momentum.",
    items: [
      {
        title: "Real Estate & Construction",
        kicker: "Built for lasting value",
        description:
          "Creating considered spaces and supporting the construction work that gives communities room to grow.",
        image: "/images/catus-real-estate.jpg",
      },
      {
        title: "Environmental Management",
        kicker: "Stewarding the places we share",
        description:
          "Practical environmental thinking for cleaner, more resilient spaces and responsible operations.",
        image: "/images/catus-environment.jpg",
      },
      {
        title: "Property Management",
        kicker: "Care beyond handover",
        description:
          "Disciplined oversight that keeps properties useful, welcoming and ready for the people who rely on them.",
        image: "/images/catus-property-management.jpg",
      },
      {
        title: "Import & Export",
        kicker: "Moving value across borders",
        description:
          "Connecting markets through dependable trade coordination and a clear view of the details.",
        image: "/images/catus-import-export.jpg",
      },
      {
        title: "Consultancy",
        kicker: "Clarity for the next decision",
        description:
          "Collaborative insight for organisations navigating opportunity, complexity and change.",
        image: "/images/catus-consultancy.jpg",
      },
      {
        title: "Cleaning Services",
        kicker: "The standard is in the detail",
        description:
          "Thoughtful, professional cleaning that makes workplaces and shared environments feel cared for.",
        image: "/images/catus-cleaning-services.jpg",
      },
    ],
  },
  projects: {
    eyebrow: "04 / Our work",
    title: "A view of",
    titleEmphasis: "possibility.",
    note: "These visual stories are illustrative sector views, not a list of Catus Synergy client projects or claims.",
    items: [
      {
        title: "Spaces that carry life forward.",
        category: "Built environment",
        location: "Illustrative sector view",
        description:
          "A considered view of the places and possibilities within real estate and construction.",
        image: "/images/catus-real-estate.jpg",
        illustrative: true,
      },
      {
        title: "Places worth caring for.",
        category: "Environment",
        location: "Illustrative sector view",
        description:
          "An illustrative view of environmental management and care for shared places.",
        image: "/images/catus-environment.jpg",
        illustrative: true,
      },
      {
        title: "Connection is a form of value.",
        category: "Trade",
        location: "Illustrative sector view",
        description:
          "An illustrative view of the connections that move value between markets.",
        image: "/images/catus-import-export.jpg",
        illustrative: true,
      },
    ],
  },
  approach: {
    eyebrow: "05 / Our approach",
    title: "Make progress",
    titleEmphasis: "make sense.",
    intro:
      "We turn a cooperative attitude into a repeatable way of working. Clear enough to move quickly, thoughtful enough to last.",
    steps: [
      {
        number: "01",
        title: "UNDERSTAND",
        copy: "We listen closely to the context, the people and the opportunity in front of us.",
      },
      {
        number: "02",
        title: "PLAN",
        copy: "We bring structure to the path ahead with clear thinking and practical priorities.",
      },
      {
        number: "03",
        title: "EXECUTE",
        copy: "We move from intention to action with care, discipline and accountability.",
      },
      {
        number: "04",
        title: "GROW",
        copy: "We learn, improve and build the relationships that make progress durable.",
      },
    ],
  },
  partners: {
    eyebrow: "06 / Trusted by",
    title: "Partnership",
    titleEmphasis: "starts with trust.",
    note: "Verified partner and client names or logos have not been supplied for publication.",
    emptyMessage:
      "Partner and client logos can be added when verified assets are available.",
    items: [],
  },
  values: {
    eyebrow: "07 / Why Catus Synergy",
    title: "Cooperative",
    titleEmphasis: "attitude.",
    intro:
      "Growth is more useful when it is shared. We bring together collaboration, professionalism, innovation, partnership, people and growth.",
    items: [
      "Collaboration",
      "Professionalism",
      "Innovation",
      "Partnership",
      "People",
      "Growth",
    ],
  },
  leadership: {
    eyebrow: "08 / Leadership",
    title: "A steady",
    titleEmphasis: "point of view.",
    name: "Ernest Ihejirika Nwachukwu",
    role: "Chief Executive Officer",
    portraitUrl: "",
    statement:
      "Cooperative Attitude Towards Growth is the company’s guiding message, supported by collaboration, professionalism, innovation, partnership, people and growth.",
  },
  contact: {
    eyebrow: "09 / Start a conversation",
    headline: "Let's build something meaningful.",
    email: "info@catussynergy.com",
    phone: "09063412678",
    location: "Lagos, Nigeria",
    socialHandle: "Catus_synergy",
    socialUrl: "",
    cta: "Get in touch",
  },
  footer: {
    tagline: "Cooperative Attitude Towards Growth",
    navigateLabel: "Navigate",
    contactLabel: "Contact",
  },
};