import { useEffect, useMemo, useState, useRef, useCallback, type FormEvent } from "react";

/* ── Types ────────────────────────────────────────────── */

type Route =
  | "home"
  | "about"
  | "features"
  | "pricing"
  | "demo"
  | "faq"
  | "contact"
  | "login"
  | "dashboard"
  | "billing"
  | "support"
  | "terms"
  | "privacy"
  | "awards"
  | "gallery";

type BillingCycle = "monthly" | "yearly";
type PaymentMethod = "card" | "upi" | "wallet";
type PlanId = "starter" | "pro" | "scale";
type SubscriptionStatus = "trial" | "active" | "canceled";
type ToastKind = "success" | "error" | "info";

type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  trialDays: number;
  features: string[];
  highlight?: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "member" | "admin" | "teacher";
  createdAt: string;
  planId?: PlanId;
  subStatus?: SubscriptionStatus;
};

type DemoBooking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  discipline: string;
  skillLevel: "Beginner" | "Intermediate" | "Advanced" | "Super Advanced";
  date: string;
  timeSlot: string; // "Morning" | "Midday" | "Afternoon" | "Evening"
  sessionFormat?: "1-on-1" | "2-on-1";
  createdAt: string;
};

type Subscription = {
  id: string;
  planId: PlanId;
  cycle: BillingCycle;
  status: SubscriptionStatus;
  coupon?: string;
  startedAt: string;
  nextRenewal: string;
  paymentMethod: PaymentMethod;
  amount: number;
};

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  source: "contact" | "chatbot" | "pricing" | "demo";
  createdAt: string;
  adminEmailQueued: boolean;
  autoReplyQueued: boolean;
};

type Ticket = {
  id: string;
  email: string;
  subject: string;
  message: string;
  priority: "normal" | "urgent";
  status: "open" | "in_review" | "closed";
  source: "support" | "chatbot";
  createdAt: string;
  adminReply?: string;
  repliedAt?: string;
};

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
  createdAt: string;
};

type AssignmentStatus = "pending" | "submitted" | "graded";

type Assignment = {
  id: string;
  planId: PlanId;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
  submissionText?: string;
  grade?: string;
  feedback?: string;
  videoUrl?: string;
};

type PracticeLog = {
  id: string;
  date: string;
  duration: number; // minutes
  notes: string;
};

type CalendarEvent = {
  id: string;
  planId: PlanId;
  title: string;
  time: string;
  instructor: string;
  meetingLink: string;
};

type DevSettings = {
  geminiApiKey?: string;
};

type Toast = { id: string; kind: ToastKind; message: string };
type CheckoutRequest = { planId: PlanId; cycle: BillingCycle };
type EnquiryInput = Omit<Enquiry, "id" | "createdAt" | "adminEmailQueued" | "autoReplyQueued">;
type TicketInput = Omit<Ticket, "id" | "createdAt" | "status" | "adminReply" | "repliedAt">;

/* ── Seed Data ───────────────────────────────────────── */

const seedAssignments: Assignment[] = [
  {
    id: "asg_1",
    planId: "starter",
    title: "Sarali Varisai Speed 1 & 2",
    description: "Record yourself singing the basic Carnatic solfege scale (Sa Ri Ga Ma Pa Dha Ni Sa) ascending and descending in Speed 1 (1 note per beat) and Speed 2 (2 notes per beat). Keep a steady Shruthi backdrop.",
    dueDate: "2026-06-01",
    status: "pending",
    videoUrl: "/Orchestral_South_11.mp4"
  },
  {
    id: "asg_2",
    planId: "starter",
    title: "Vocal Pitch Matching Exercise",
    description: "Sing along with the 3 Shruthi reference tones provided in the lesson recording and sustain Sa, Pa, and high Sa for 8 beats each without wobble.",
    dueDate: "2026-06-08",
    status: "pending"
  },
  {
    id: "asg_3",
    planId: "pro",
    title: "Alankar & Thaat Bilawal Practice",
    description: "Perform the first 4 Alankars in Thaat Bilawal (equivalent to Carnatic Shankarabharanam / major scale) set to Teental (16 beats). Submit recording.",
    dueDate: "2026-06-03",
    status: "pending",
    videoUrl: "/Orchestral_South_Indian_instrume…_202605202331.mp4"
  },
  {
    id: "asg_4",
    planId: "pro",
    title: "Guru Shishya Raga Phrasing",
    description: "Listen to the classical phrasing loops of Raga Yaman and record your own improvisations (Aalap) using the specified rules of ascent (Arohana omit Sa and Pa).",
    dueDate: "2026-06-10",
    status: "pending"
  },
  {
    id: "asg_5",
    planId: "scale",
    title: "Keyboard Synthesis & Accompaniment",
    description: "Prepare the left-hand chord inversions for the Trinity Grade 3 classical performance piece, maintaining steady syncopated rhythm loops.",
    dueDate: "2026-06-05",
    status: "pending",
    videoUrl: "/Orchestral_South_11.mp4"
  },
  {
    id: "asg_6",
    planId: "scale",
    title: "Advanced Tala Mastery & Solkattu",
    description: "Recite the Solkattu (rhythm syllables) for a double-speed Adi Tala structure (16 subdivisions per cycle) over 4 full cycles while keeping constant hand-clap counters.",
    dueDate: "2026-06-12",
    status: "pending"
  }
];

const seedCalendarEvents: CalendarEvent[] = [
  {
    id: "evt_1",
    planId: "starter",
    title: "Vocal Basics & Raga Foundation",
    time: "Saturdays at 10:00 AM IST",
    instructor: "Guru Dr. R. Subramanian",
    meetingLink: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: "evt_2",
    planId: "starter",
    title: "Interactive Pitch Review Session",
    time: "Thursdays at 6:30 PM IST",
    instructor: "Smt. Meera Krishnan",
    meetingLink: "https://meet.google.com/xyz-uvwx-yza"
  },
  {
    id: "evt_3",
    planId: "pro",
    title: "Guru Pro Hindustani Raga Yaman Aalap",
    time: "Saturdays at 11:30 AM IST",
    instructor: "Guru Dr. R. Subramanian",
    meetingLink: "https://meet.google.com/mno-pqrs-tuv"
  },
  {
    id: "evt_4",
    planId: "pro",
    title: "Tala Phrasing & Adi Tala Rhythm Desk",
    time: "Tuesdays at 5:00 PM IST",
    instructor: "Guru Sri K. R. Raman",
    meetingLink: "https://meet.google.com/efg-hijk-lmn"
  },
  {
    id: "evt_5",
    planId: "scale",
    title: "Advanced Concert Arangetram Coaching",
    time: "Sundays at 9:00 AM IST",
    instructor: "Guru Dr. R. Subramanian",
    meetingLink: "https://meet.google.com/qrs-tuvw-xyz"
  },
  {
    id: "evt_6",
    planId: "scale",
    title: "Keyboard Synthesis & Accompaniment Lab",
    time: "Wednesdays at 7:00 PM IST",
    instructor: "Sri Keith D'Souza",
    meetingLink: "https://meet.google.com/hij-klmn-opq"
  }
];

/* ── Data ─────────────────────────────────────────────── */

const academyName = "Sai Music Academy";
const routes: Route[] = ["home", "about", "features", "pricing", "demo", "faq", "contact", "login", "dashboard", "billing", "support", "terms", "privacy", "awards", "gallery"];

const mainNav: { label: string; route: Route }[] = [
  { label: "Home", route: "home" },
  { label: "About", route: "about" },
  { label: "Gallery", route: "gallery" },
  { label: "Awards", route: "awards" },
  { label: "Courses", route: "pricing" },
  { label: "1-on-1 Demo", route: "demo" },
  { label: "FAQ", route: "faq" },
  { label: "Contact", route: "contact" },
];

const plans: Plan[] = [
  {
    id: "starter",
    name: "Beginner",
    tagline: "For new learners starting live online lessons.",
    monthly: 1499,
    yearly: 14990,
    trialDays: 14,
    features: ["1 live class per week", "Practice assignments", "Class reminders", "Basic progress tracking", "Email support"],
  },
  {
    id: "pro",
    name: "Intermediate",
    tagline: "For serious students who need recordings and faster feedback.",
    monthly: 2999,
    yearly: 29990,
    trialDays: 14,
    highlight: true,
    features: ["2 live classes per week", "Recorded class library", "Teacher feedback notes", "Reschedule controls", "Priority support"],
  },
  {
    id: "scale",
    name: "Advanced",
    tagline: "For families, schools, and multi-student learning pods.",
    monthly: 7499,
    yearly: 74990,
    trialDays: 7,
    features: ["Multi-student dashboard", "Dedicated success manager", "Custom lesson plan", "Billing admin tools", "Support SLA"],
  },
];

const featureList = [
  { title: "Classical Roots", desc: "Carnatic and Hindustani traditions taught by Grade-certified masters with decades of concert experience." },
  { title: "Keyboard & Western", desc: "Trinity/ABRSM-aligned keyboard and piano curriculum from beginner to Grade 8 performance level." },
  { title: "Vocal Arts", desc: "Light classical, Bhajans, Film music, and Stage performance coaching for all voice types and age groups." },
  { title: "Online & Offline", desc: "Flexible hybrid classes — attend from our studio or join live interactive sessions from home." },
  { title: "Concert & Grading", desc: "Annual Arangetram, student recitals, and recognized exam preparation for Carnatic, Trinity, and ABRSM boards." },
  { title: "All Ages Welcome", desc: "Dedicated tracks for children (5+), teens, adults, and senior learners — because music has no age." },
];

const faqList = [
  { q: "Can I start with a trial?", a: "Yes. Each plan supports a trial window during checkout. You can add a coupon before payment confirmation." },
  { q: "Which payment methods are supported?", a: "The checkout supports card, UPI, and wallet flows. It is structured for Stripe, Razorpay, or another secure gateway." },
  { q: "Can I upgrade or downgrade later?", a: "Yes. The billing page lets signed-in users renew, cancel, upgrade, or downgrade with immediate state updates." },
  { q: "Does the contact form send email?", a: "It validates every field, stores the enquiry, and queues admin and auto-reply email records. Connect the API hook to your provider for live delivery." },
  { q: "Can a support agent take over chat?", a: "Yes. The chatbot collects handoff details and creates a support ticket that appears in the support and dashboard areas." },
];

const testimonials = [
  {
    quote: "Learning Carnatic vocal at Sai Music Academy changed how I experience silence. Every raga is a new conversation with myself.",
    name: "Priya Raghunathan",
    role: "Carnatic Vocal — Advanced",
  },
  {
    quote: "My son's keyboard progress in 6 months was extraordinary. The teacher's patience and the structured Trinity grading path made all the difference.",
    name: "Meena Krishnamurthy",
    role: "Parent",
  },
  {
    quote: "Started Hindustani at 52. The academy welcomed me without judgment and gave me a practice structure I could sustain alongside my career.",
    name: "Suresh Nair",
    role: "Adult Learner",
  },
];

const courseCards = [
  { tag: "Carnatic", title: "Vocal — Beginner", sub: "Ages 5+ · 3 months", fee: "₹1,200" },
  { tag: "Keyboard", title: "Trinity Grade 1–3", sub: "Ages 8+ · 6 months", fee: "₹1,500" },
  { tag: "Hindustani", title: "Vocal — Intermediate", sub: "All ages · 6 months", fee: "₹1,400" },
  { tag: "Western", title: "Piano — ABRSM Path", sub: "Ages 10+ · 12 months", fee: "₹2,000" },
  { tag: "Carnatic", title: "Veena — Foundation", sub: "Ages 12+ · 4 months", fee: "₹1,300" },
  { tag: "Vocal", title: "Film & Light Classical", sub: "All ages · Ongoing", fee: "₹1,100" },
  { tag: "Advanced", title: "Arangetram Prep", sub: "By assessment · 12mo", fee: "₹2,500" },
  { tag: "Online", title: "Live Virtual Sessions", sub: "All ages · Flexible", fee: "₹900" },
];

const couponCodes: Record<string, number> = { SAI20: 20, TRIAL30: 30, YEARLY10: 10 };

/* ── Helpers ──────────────────────────────────────────── */

function uid(p = "id") { return `${p}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`; }
function sleep(ms: number) { return new Promise<void>((r) => window.setTimeout(r, ms)); }
function routeHref(route: Route) { return route === "home" ? "#/" : `#/${route}`; }
function getRouteFromHash(): Route { const raw = window.location.hash.replace(/^#\/?/, "") || "home"; return (routes as string[]).includes(raw) ? (raw as Route) : "home"; }
function formatMoney(v: number) { return `INR ${v.toLocaleString("en-IN")}`; }
function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString(); }
function getPlan(id: PlanId) { return plans.find((p) => p.id === id) ?? plans[0]; }

function useStoredState<T>(key: string, init: T) {
  const [v, s] = useState<T>(() => { try { const r = window.localStorage.getItem(key); return r ? (JSON.parse(r) as T) : init; } catch { return init; } });
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(v)); }, [key, v]);
  return [v, s] as const;
}

function useRoute() {
  const [route, setRoute] = useState<Route>(getRouteFromHash);
  useEffect(() => { const h = () => setRoute(getRouteFromHash()); window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, []);
  const navigate = useCallback((r: Route) => { window.location.hash = routeHref(r); setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  return [route, navigate] as const;
}

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); obs.unobserve(e.target); } }), { threshold: 0.15 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── SVG Logo ─────────────────────────────────────────── */

function LogoSVG({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" width={size} height={size}>
      <circle cx="24" cy="24" r="23" stroke="#D4A853" strokeWidth="1" />
      <circle cx="24" cy="24" r="20" fill="rgba(212,168,83,0.08)" />
      <path d="M24 8 C24 8 20 12 20 16 C20 20 22 21 24 22 C26 23 28 25 28 28 C28 32 26 35 24 36 C22 37 20 37 19 35.5" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M24 22 C27 22 30 24 30 27 C30 30 28 32 24 32 C20 32 18 30 18 27 C18 25 19 23.5 21 23" stroke="#D4A853" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="21" cy="35" r="1.5" fill="#D4A853" />
      <path d="M32 20 C34 22 34 26 32 28" stroke="#D4A853" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".6" />
      <path d="M35 17 C38.5 21 38.5 27 35 31" stroke="#D4A853" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".35" />
      <circle cx="24" cy="40" r="1" fill="rgba(212,168,83,0.5)" />
      <circle cx="16" cy="10" r=".6" fill="rgba(212,168,83,0.4)" />
      <circle cx="32" cy="10" r=".6" fill="rgba(212,168,83,0.4)" />
    </svg>
  );
}

/* ── Particle Canvas ──────────────────────────────────── */

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const ps: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    for (let i = 0; i < 50; i++) ps.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.5 + 0.5, o: Math.random() * 0.4 + 0.05 });
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(212,168,83,${p.o})`; ctx.fill();
      });
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y);
        if (d < 120) { ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.strokeStyle = `rgba(212,168,83,${0.12 * (1 - d / 120)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="particles-canvas" />;
}

/* ── Counter Animation ────────────────────────────────── */

function StatCounter({ target, suffix = "+" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let c = 0;
      const step = target / 60;
      const timer = setInterval(() => { c += step; if (c >= target) { c = target; clearInterval(timer); } setVal(Math.round(c)); }, 25);
      obs.unobserve(el);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref} className="stat-num">{target >= 100 ? `${val}${suffix}` : val}</span>;
}

/* ── Toast ────────────────────────────────────────────── */

function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={`toast toast-${t.kind}`}>{t.message}</div>)}
    </div>
  );
}

/* ── Section Heading ──────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return <div className="section-label"><span>{children}</span></div>;
}

/* ── Header ───────────────────────────────────────────── */

function Header({ route, user, navigate }: { route: Route; user: User | null; navigate: (r: Route) => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 60); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);
  return (
    <nav className={`site-nav ${scrolled ? "nav-scrolled" : ""}`}>
      <a className="nav-logo" href={routeHref("home")}>
        <LogoSVG size={48} />
        <div className="nav-brand">
          <span className="nav-brand-main">Sai Music</span>
          <span className="nav-brand-sub">Academy</span>
        </div>
      </a>
      <div className="nav-links hidden lg:flex">
        {mainNav.map((item) => (
          <a key={item.route} className={route === item.route ? "nav-link active" : "nav-link"} href={routeHref(item.route)}>{item.label}</a>
        ))}
        {user ? <a className="nav-link" href={routeHref("dashboard")}>Dashboard</a> : <a className="nav-link" href={routeHref("login")}>Login</a>}
        <button className="nav-cta" onClick={() => navigate("pricing")}>Enroll Now</button>
      </div>
    </nav>
  );
}

/* ── Hero ─────────────────────────────────────────────── */

function Hero({ navigate, openCheckout, user }: { navigate: (r: Route) => void; openCheckout: (planId: PlanId, cycle: BillingCycle) => void; user: User | null }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    const handleMouse = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      const rx = (e.clientX / window.innerWidth - 0.5) * 30; // -15 to +15 deg drift
      const ry = (e.clientY / window.innerHeight - 0.5) * 30;
      setTilt({ x: rx, y: ry });
    };
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollDown = () => {
    const nextSection = document.querySelector(".stats-strip");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  // Parallax offsets
  const getStyle = (coef: number, baseZ = 0) => {
    if (isMobile) return {};
    const tx = tilt.x * coef;
    const ty = tilt.y * coef;
    const scrollOffset = scrollY * coef * 0.8;
    return {
      transform: `translate3d(${tx}px, ${ty + scrollOffset}px, ${baseZ}px) rotateX(${-ty * 0.05}deg) rotateY(${tx * 0.05}deg)`,
      opacity: Math.max(0, 1 - scrollY / 600),
      transition: "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)",
    };
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black perspective-1000 preserve-3d">
      {/* Background video with enhanced cinematic color grading */}
      <video
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/images/sai-music-academy-hero.jpg"
        src="/hero-music.mp4"
        style={{
          transform: isMobile ? undefined : `scale(${1 + scrollY * 0.0003}) translateY(${scrollY * 0.08}px)`,
          filter: "contrast(1.22) brightness(0.44) saturate(0.85)",
        }}
      />

      {/* Premium Cinematic Radial Vignette & Scanline Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 20%, rgba(0, 0, 0, 0.72) 90%)",
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.14]"
        style={{
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.08) 50%, rgba(0, 0, 0, 0.16) 50%)",
          backgroundSize: "100% 4px",
        }}
      />


      {/* Floating pill-shaped navbar */}
      <nav className="fixed z-50 px-4 md:px-10 pt-6 top-0 left-0 right-0 flex items-center justify-between gap-4 pointer-events-auto">
        {/* Left pill */}
        <div 
          className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md rounded-full pl-3 pr-4 py-2 md:pl-4 md:pr-6 md:py-2.5 border border-white/10 shadow-lg cursor-pointer hover:bg-neutral-800/90 transition-all" 
          onClick={() => navigate("home")}
        >
          <LogoSVG size={22} />
          <span className="text-white text-xs md:text-sm font-semibold tracking-wide uppercase">sai music</span>
        </div>

        {/* Center pill */}
        <div className="hidden md:flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md rounded-full px-3 py-2 border border-white/10 shadow-lg">
          <button onClick={() => navigate("home")} className="text-neutral-300 hover:text-white transition-colors text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer bg-transparent border-none">home</button>
          <button onClick={handleScrollDown} className="text-neutral-300 hover:text-white transition-colors text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer bg-transparent border-none">about</button>
          <button onClick={() => navigate("pricing")} className="text-neutral-300 hover:text-white transition-colors text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer bg-transparent border-none">courses</button>
          <button onClick={() => navigate("demo")} className="text-neutral-300 hover:text-white transition-colors text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer bg-transparent border-none">1-on-1 demo</button>
          <button onClick={() => navigate("faq")} className="text-neutral-300 hover:text-white transition-colors text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer bg-transparent border-none">faq</button>
          <button onClick={() => navigate("contact")} className="text-neutral-300 hover:text-white transition-colors text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer bg-transparent border-none">contact</button>
          {user ? (
            <button onClick={() => navigate("dashboard")} className="text-neutral-300 hover:text-white transition-colors text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer bg-transparent border-none">dashboard</button>
          ) : (
            <button onClick={() => navigate("login")} className="text-neutral-300 hover:text-white transition-colors text-xs uppercase tracking-wider px-4 py-2 rounded-full cursor-pointer bg-transparent border-none">login</button>
          )}
        </div>

        {/* Right button */}
        <button
          onClick={() => navigate("pricing")}
          className="bg-white text-black text-xs font-semibold uppercase tracking-wider rounded-full px-4 py-2.5 md:px-6 md:py-3 hover:bg-neutral-200 transition-colors cursor-pointer border-none shadow-md"
        >
          enroll now
        </button>
      </nav>

      {/* Foreground content wrapper */}
      <div className="relative h-full w-full pointer-events-none z-10 preserve-3d flex flex-col justify-center px-6 md:px-16 lg:px-24">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 md:gap-8 justify-center h-full pt-20 md:pt-24 pb-12">
          
          {/* Staggered Row 1: "where" */}
          <div className="w-full flex justify-start">
            <h1
              className="hero-title text-white font-medium text-[13vw] md:text-[8.5vw] xl:text-[8vw] will-change-transform uppercase select-none leading-[0.9] tracking-tighter"
              style={getStyle(0.35, 50)}
            >
              where
            </h1>
          </div>

          {/* Staggered Row 2: "music" + Description side-by-side */}
          <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12">
            {/* Description on left, ordered second on mobile */}
            <p
              className="text-white/80 text-[14px] md:text-[16px] leading-relaxed max-w-[320px] md:max-w-[280px] will-change-transform font-light select-none order-2 md:order-1 self-start md:self-center md:pl-2"
              style={getStyle(-0.15, 10)}
            >
              Rooted in classical tradition. Shaped for the modern soul. Carnatic · Hindustani · Western · Keyboard · Vocal
            </p>

            {/* "music" on right, ordered first on mobile */}
            <h1
              className="hero-title text-white font-medium text-[13vw] md:text-[8.5vw] xl:text-[8vw] md:text-right will-change-transform uppercase select-none leading-[0.9] tracking-tighter order-1 md:order-2"
              style={getStyle(-0.25, 30)}
            >
              music
            </h1>
          </div>

          {/* Staggered Row 3: "awakens" */}
          <div className="w-full flex justify-start md:justify-center lg:justify-start lg:pl-[12%]">
            <h1
              className="hero-title text-white font-medium text-[13vw] md:text-[8.5vw] xl:text-[8vw] will-change-transform uppercase select-none leading-[0.9] tracking-tighter"
              style={getStyle(0.45, 70)}
            >
              awakens
            </h1>
          </div>

        </div>

        {/* Floating stats block - top-right (absolute edges, safe from flex content) */}
        <div
          className="hidden xl:flex absolute right-16 top-[18%] flex-col items-end will-change-transform select-none"
          style={getStyle(0.2, 20)}
        >
          <div className="flex items-center gap-3 justify-end">
            <div className="hidden xl:block h-px w-16 bg-white/30 rotate-[20deg]" />
            <span className="text-4xl font-medium tracking-tight text-white">14+</span>
          </div>
          <span className="text-xs text-white/60 mt-0.5 text-right">Years of Legacy</span>
        </div>

        {/* Floating stats block - bottom-left (absolute edges, safe from flex content) */}
        <div
          className="hidden xl:flex absolute left-16 bottom-[12%] flex-col items-start will-change-transform select-none"
          style={getStyle(-0.2, 15)}
        >
          <div className="flex items-center gap-3 justify-start">
            <span className="text-white text-4xl font-medium tracking-tight">2400+</span>
            <div className="hidden xl:block h-px w-16 bg-white/30 rotate-[-20deg]" />
          </div>
          <span className="text-xs text-white/60 mt-0.5">Students Trained</span>
        </div>

        {/* Floating stats block - bottom-right (absolute edges, safe from flex content) */}
        <div
          className="hidden xl:flex absolute right-16 bottom-[12%] flex-col items-end will-change-transform select-none"
          style={getStyle(0.3, 25)}
        >
          <div className="flex items-center gap-3 justify-end">
            <div className="hidden xl:block h-px w-16 bg-white/30 rotate-[-20deg]" />
            <span className="text-4xl font-medium tracking-tight text-white">12</span>
          </div>
          <span className="text-xs text-white/60 mt-0.5 text-right">Courses Offered</span>
        </div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-black z-10" />
    </section>
  );
}

/* ── Stats Strip ──────────────────────────────────────── */

function StatsStrip() {
  return (
    <div className="stats-strip">
      <div><StatCounter target={14} suffix="+" /><div className="stat-label">Years of Legacy</div></div>
      <div><StatCounter target={2400} suffix="+" /><div className="stat-label">Students Trained</div></div>
      <div><StatCounter target={12} /><div className="stat-label">Courses Offered</div></div>
      <div><StatCounter target={98} suffix="%" /><div className="stat-label">Satisfaction</div></div>
    </div>
  );
}

/* ── About Section ────────────────────────────────────── */

function AboutSection() {
  return (
    <section className="section" id="about" data-reveal>
      <SectionLabel>Our Philosophy</SectionLabel>
      <div className="about-grid">
        <div>
          <h2 className="section-title">Music is not just learned.<br /><em>It is awakened.</em></h2>
          <p className="section-copy">At Sai Music Academy, we believe every student carries an innate rhythm. Our masters — trained in the deepest classical traditions — guide that rhythm toward expression, discipline, and joy.</p>
          <p className="section-copy mt-4">From Carnatic ragas to Western harmony, from keyboard basics to advanced vocal performance — our curriculum flows from the root, adapting to every age and aspiration.</p>
        </div>
        <div className="about-staff-svg">
          <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="gStaff" x1="0" y1="0" x2="400" y2="0"><stop offset="0%" stopColor="#D4A853" stopOpacity="0" /><stop offset="30%" stopColor="#D4A853" stopOpacity=".5" /><stop offset="70%" stopColor="#D4A853" stopOpacity=".5" /><stop offset="100%" stopColor="#D4A853" stopOpacity="0" /></linearGradient></defs>
            <line x1="20" y1="90" x2="380" y2="90" stroke="url(#gStaff)" strokeWidth=".8" />
            <line x1="20" y1="110" x2="380" y2="110" stroke="url(#gStaff)" strokeWidth=".8" />
            <line x1="20" y1="130" x2="380" y2="130" stroke="url(#gStaff)" strokeWidth=".8" />
            <line x1="20" y1="150" x2="380" y2="150" stroke="url(#gStaff)" strokeWidth=".8" />
            <line x1="20" y1="170" x2="380" y2="170" stroke="url(#gStaff)" strokeWidth=".8" />
            <path d="M55 185 C55 185 52 175 52 160 C52 130 60 115 68 100 C76 85 78 70 74 58 C70 46 60 42 54 48 C48 54 46 66 50 76 C54 86 64 90 72 88" stroke="#D4A853" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".8" />
            <circle cx="58" cy="182" r="6" fill="none" stroke="#D4A853" strokeWidth="1.5" opacity=".8" />
            <line x1="58" y1="176" x2="58" y2="88" stroke="#D4A853" strokeWidth="1.5" opacity=".8" />
            <ellipse cx="130" cy="130" rx="8" ry="6" fill="#D4A853" opacity=".6" transform="rotate(-15 130 130)" />
            <line x1="138" y1="130" x2="138" y2="85" stroke="#D4A853" strokeWidth="1.2" opacity=".6" />
            <ellipse cx="185" cy="110" rx="8" ry="6" fill="#D4A853" opacity=".5" transform="rotate(-15 185 110)" />
            <line x1="193" y1="110" x2="193" y2="65" stroke="#D4A853" strokeWidth="1.2" opacity=".5" />
            <ellipse cx="240" cy="150" rx="8" ry="6" fill="#D4A853" opacity=".7" transform="rotate(-15 240 150)" />
            <line x1="248" y1="150" x2="248" y2="105" stroke="#D4A853" strokeWidth="1.2" opacity=".7" />
            <ellipse cx="295" cy="120" rx="8" ry="6" fill="#D4A853" opacity=".45" transform="rotate(-15 295 120)" />
            <line x1="303" y1="120" x2="303" y2="75" stroke="#D4A853" strokeWidth="1.2" opacity=".45" />
            <ellipse cx="340" cy="140" rx="8" ry="6" fill="#D4A853" opacity=".55" transform="rotate(-15 340 140)" />
            <line x1="348" y1="140" x2="348" y2="95" stroke="#D4A853" strokeWidth="1.2" opacity=".55" />
            <text x="200" y="240" textAnchor="middle" fontSize="48" fill="rgba(212,168,83,0.15)" fontFamily="serif">ॐ</text>
            <path d="M120 210 C145 195 165 225 190 210 C215 195 235 225 260 210 C285 195 305 225 330 210" stroke="rgba(212,168,83,0.25)" strokeWidth="1" fill="none" />
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ── Features Section ─────────────────────────────────── */

function FeaturesSection() {
  return (
    <section className="section" id="features" data-reveal>
      <SectionLabel>What We Offer</SectionLabel>
      <h2 className="section-title">Choose Your <em>Musical Path</em></h2>
      <div className="features-grid">
        {featureList.map((f, i) => (
          <div key={f.title} className="feat-card" data-reveal>
            <div className="feat-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="feat-title">{f.title}</div>
            <p className="feat-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Courses Marquee ──────────────────────────────────── */

function CoursesMarquee() {
  return (
    <section className="courses-section" id="courses" data-reveal>
      <div className="courses-inner">
        <SectionLabel>Our Curriculum</SectionLabel>
        <h2 className="section-title">Explore <em>Courses</em></h2>
      </div>
      <div className="courses-marquee">
        <div className="courses-track">
          {[...courseCards, ...courseCards].map((c, i) => (
            <div key={i} className="course-card">
              <span className="course-tag">{c.tag}</span>
              <div className="course-title">{c.title}</div>
              <div className="course-sub">{c.sub}</div>
              <div className="course-fee">{c.fee} <span>/mo</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────── */

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  useEffect(() => { const t = setInterval(() => setActive((p) => (p + 1) % testimonials.length), 5000); return () => clearInterval(t); }, []);
  const t = testimonials[active];
  return (
    <section className="section testimonials-section" id="testimonials" data-reveal>
      <div className="testimonials-layout">
        <div>
          <SectionLabel>Student Stories</SectionLabel>
          <blockquote className="testimonial-quote">"{t.quote}"</blockquote>
          <div className="testimonial-author">
            <div className="author-avatar">{t.name.split(" ").map((w) => w[0]).join("")}</div>
            <div className="author-info"><strong>{t.name}</strong><span>{t.role}</span></div>
          </div>
        </div>
        <div className="testi-cards">
          {testimonials.map((tc, i) => (
            <button key={i} className={`testi-mini ${i === active ? "is-active" : ""}`} onClick={() => setActive(i)}>
              <div className="stars">★★★★★</div>
              <p>"{tc.quote.slice(0, 100)}..."</p>
              <div className="testi-mini-author">{tc.name}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ──────────────────────────────────────────────── */

function CTASection({ navigate }: { navigate: (r: Route) => void }) {
  return (
    <section className="footer-cta" id="contact" data-reveal>
      <div className="deco-ring" style={{ width: 800, height: 800, top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.4 }} />
      <div className="deco-ring" style={{ width: 500, height: 500, top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.3 }} />
      <div className="cta-inner">
        <SectionLabel>Begin Your Journey</SectionLabel>
        <h2 className="cta-title">Your first note is<br /><em>waiting to be played.</em></h2>
        <p className="cta-copy">Join our next intake in Hosur or online. Trial class available. No prior experience needed.</p>
        <div className="cta-actions">
          <button className="cta-btn" onClick={() => navigate("pricing")}>
            <svg className="btn-shape" viewBox="0 0 184 65" fill="none" preserveAspectRatio="none"><path d="M12 0 H172 L184 32.5 L172 65 H12 L0 32.5 Z" fill="#D4A853" /></svg>
            <span className="cta-btn-label">Enroll Now</span>
          </button>
          <a className="cta-secondary" href="tel:7200747726">Call Us Today</a>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-col">
          <a className="nav-logo" href={routeHref("home")}><LogoSVG size={40} /><div className="nav-brand"><span className="nav-brand-main">Sai Music</span><span className="nav-brand-sub">Academy</span></div></a>
          <div className="footer-hours">
            <strong>Open Hours</strong>
            <p>Monday - Sunday: 09 AM - 10 PM</p>
          </div>
          <div className="footer-contact">
            <strong>Phone:</strong> 7200747726 / 9952183181<br />
            <strong>Email:</strong> ganeshbabu0704@gmail.com
          </div>
        </div>
        <div className="footer-links-col">
          <div className="footer-col">
            <h4>Academy</h4>
            {["about", "gallery", "awards", "features"].map((r) => <a key={r} className="footer-link" href={routeHref(r as Route)}>{r}</a>)}
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            {["pricing", "login", "dashboard", "billing"].map((r) => <a key={r} className="footer-link" href={routeHref(r as Route)}>{r}</a>)}
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            {["contact", "support", "terms", "privacy"].map((r) => <a key={r} className="footer-link" href={routeHref(r as Route)}>{r}</a>)}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 {academyName} · Hosur, Tamil Nadu · All Rights Reserved</p>
        <div className="footer-soc">
          <a href="#">Instagram</a>
          <a href="#">YouTube</a>
          <a href="#">WhatsApp</a>
        </div>
      </div>
    </footer>
  );
}

/* ── PageShell ────────────────────────────────────────── */

function PageShell({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
        <SectionLabel>{kicker}</SectionLabel>
        <h2 className="section-title">{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </main>
  );
}

function Field({ label, error, wide = false, children }: { label: string; error?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`field ${wide ? "field-wide" : ""}`}>
      <span>{label}</span>
      {children}
      {error ? <em>{error}</em> : null}
    </label>
  );
}

/* ── About Page ───────────────────────────────────────── */

function AboutPage() {
  return (
    <PageShell kicker="About" title="A live music academy for every learner.">
      <div className="about-page-layout">
        <div className="prose-block">
          <p>Sai Music Academy is a trusted online and offline music learning academy based in Shanthapuram, Hosur, Tamil Nadu. We provide one-to-one live music lessons, guided practice, subscriptions, support, and student communication through a modern web platform.</p>
          <p>Our experienced gurus teach Carnatic vocals, Hindustani vocals, guitar, keyboard, violin, piano, mridangam, tabla, flute, drums, saxophone, and more.</p>
          <p>The platform keeps users, subscriptions, enquiries, support tickets, and chatbot logs in persistent state so a backend team can connect secure APIs without redesigning the product experience.</p>
        </div>
        <div className="about-cards-grid">
          <div className="about-card"><h3>Open Hours</h3><p>Monday - Sunday</p><p className="about-highlight">09 AM - 10 PM</p><p>Classes available throughout the day with flexible scheduling.</p></div>
          <div className="about-card"><h3>Contact & Email</h3><p><strong>Phone:</strong> 7200747726 / 9952183181</p><p><strong>Email:</strong> ganeshbabu0704@gmail.com</p></div>
          <div className="about-card"><h3>Address</h3><p>Sai Music Academy</p><p>QR6F+598, Shanthapuram</p><p>Hosur, Tamil Nadu 635126</p></div>
        </div>
      </div>
    </PageShell>
  );
}

/* ── Features Page ────────────────────────────────────── */

function FeaturesPage() {
  return (
    <PageShell kicker="Features" title="Production-grade music education flows.">
      <div className="features-grid">
        {featureList.map((f, i) => (
          <div key={f.title} className="feat-card"><div className="feat-num">{String(i + 1).padStart(2, "0")}</div><div className="feat-title">{f.title}</div><p className="feat-desc">{f.desc}</p></div>
        ))}
      </div>
    </PageShell>
  );
}

/* ── Pricing Page ─────────────────────────────────────── */

function PricingPage({ openCheckout }: { openCheckout: (planId: PlanId, cycle: BillingCycle) => void }) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  return (
    <PageShell kicker="Pricing" title="Choose monthly flexibility or yearly savings.">
      <div className="billing-toggle">
        <button className={cycle === "monthly" ? "active" : ""} onClick={() => setCycle("monthly")}>Monthly</button>
        <button className={cycle === "yearly" ? "active" : ""} onClick={() => setCycle("yearly")}>Yearly</button>
      </div>
      <div className="pricing-grid mt-10">
        {plans.map((plan) => {
          const price = cycle === "monthly" ? plan.monthly : plan.yearly;
          return (
            <article key={plan.id} className={`pricing-card ${plan.highlight ? "highlighted" : ""}`}>
              <div><p className="plan-tag">{plan.trialDays}-day trial</p><h3 className="plan-name">{plan.name}</h3><p className="plan-copy">{plan.tagline}</p><p className="plan-price">{formatMoney(price)} <span>/{cycle === "monthly" ? "mo" : "yr"}</span></p><ul>{plan.features.map((f) => <li key={f}>{f}</li>)}</ul></div>
              <button className="cta-btn pricing-cta" onClick={() => openCheckout(plan.id, cycle)}>
                <svg className="btn-shape" viewBox="0 0 184 65" fill="none" preserveAspectRatio="none"><path d="M12 0 H172 L184 32.5 L172 65 H12 L0 32.5 Z" fill={plan.highlight ? "#D4A853" : "rgba(212,168,83,0.2)"} /></svg>
                <span className="cta-btn-label">Start {plan.name}</span>
              </button>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}

/* ── FAQ Page ─────────────────────────────────────────── */

function FAQPage() {
  return (
    <PageShell kicker="FAQ" title="Answers for subscriptions, payment, chatbot, and support.">
      <div className="faq-list">{faqList.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
    </PageShell>
  );
}

/* ── 1-on-1 Demo Booking Page ──────────────────────────── */

function DemoPage({
  createEnquiry,
  createDemoBooking
}: {
  createEnquiry: (input: EnquiryInput, skipWhatsApp?: boolean) => Promise<Enquiry>;
  createDemoBooking: (input: Omit<DemoBooking, "id" | "createdAt">) => Promise<DemoBooking>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    discipline: "Carnatic Vocal",
    skillLevel: "Beginner" as "Beginner" | "Intermediate" | "Advanced" | "Super Advanced",
    sessionFormat: "1-on-1" as "1-on-1" | "2-on-1",
    date: "",
    timeSlot: "Morning" as "Morning" | "Midday" | "Afternoon" | "Evening"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const disciplines = [
    { group: "Vocals", items: ["Carnatic Vocal", "Hindustani Vocal", "Western Vocal"] },
    { group: "Percussion", items: ["Mridangam", "Tabla", "Ghatam", "Kanjira", "Konnakol", "Cajon", "Morsing"] },
    { group: "Melodic Instruments", items: ["Veena", "Violin", "Flute", "Keyboard", "Guitar", "Sitar", "Mandolin", "Saxophone", "Harmonium", "Recorder"] },
    { group: "Dance & Wellness", items: ["Bharatanatyam", "Yoga"] }
  ];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.name.trim().length < 2) err.name = "Enter your name.";
    if (!validateEmail(form.email)) err.email = "Enter a valid email.";
    if (form.phone.trim().length < 7) err.phone = "Enter a valid phone number.";
    if (!form.date) err.date = "Select a preferred demo date.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setLoading(true);
    const db = await createDemoBooking({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      discipline: form.discipline,
      skillLevel: form.skillLevel,
      sessionFormat: form.sessionFormat,
      date: form.date,
      timeSlot: form.timeSlot
    });
    // Create standard enquiry as well for lead channel integration
    await createEnquiry({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      subject: `Demo Booking: ${form.discipline} (${form.sessionFormat})`,
      message: `Requested demo class for ${form.discipline} (${form.skillLevel} level, ${form.sessionFormat} format) on ${form.date} in the ${form.timeSlot} slot.`,
      source: "demo"
    }, true);
    setLoading(false);
    setConfirmation(`Demo Scheduled successfully! Reference ID is ${db.id}. Check inbox for invitation.`);
    setForm({
      name: "",
      email: "",
      phone: "",
      discipline: "Carnatic Vocal",
      skillLevel: "Beginner",
      sessionFormat: "1-on-1",
      date: "",
      timeSlot: "Morning"
    });
  };

  return (
    <PageShell kicker="Schedule a Demo" title="Book a 1-on-1 trial class with top Gurus at zero fee.">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] text-left">
        <div className="dash-card rounded-xl border-gold/15 bg-gradient-to-br from-gold/5 to-transparent">
          <h3 className="mb-4 text-gold">🎯 Personalised Demo Request</h3>
          <p className="text-xs opacity-75 mb-6">Select your primary discipline and preferred availability. Our Guru board will assign a designated trainer and dispatch private meeting credentials.</p>
          
          <form className="grid gap-5" onSubmit={submit} noValidate>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Full Name" error={errors.name}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Select Discipline / Program">
                <select 
                  value={form.discipline} 
                  onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                  className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-gold/50 focus:outline-none transition w-full font-sans animate-shine"
                >
                  {disciplines.map((group) => (
                    <optgroup key={group.group} label={group.group} className="bg-slate-900 text-gold">
                      {group.items.map((item) => (
                        <option key={item} value={item} className="text-white bg-slate-950">{item}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Field>

              <Field label="Select Current Skill Level">
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {(["Beginner", "Intermediate", "Advanced", "Super Advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setForm({ ...form, skillLevel: lvl })}
                      className={`text-[9px] py-1.5 px-2.5 rounded border transition-all ${
                        form.skillLevel === lvl 
                          ? "bg-gold/20 text-gold border-gold font-bold" 
                          : "bg-black/30 text-cream-50 border-white/10 hover:border-white/30"
                      }`}
                    >
                      {lvl.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Session Format">
                <div className="flex gap-2 mt-1">
                  {(["1-on-1", "2-on-1"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setForm({ ...form, sessionFormat: fmt })}
                      className={`text-[9px] py-1.5 px-3 rounded border transition-all flex-1 font-semibold ${
                        form.sessionFormat === fmt 
                          ? "bg-gold/20 text-gold border-gold font-bold" 
                          : "bg-black/30 text-cream-50 border-white/10 hover:border-white/30"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Preferred Date" error={errors.date}>
                <input 
                  type="date" 
                  value={form.date} 
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-gold/50 focus:outline-none transition w-full" 
                  min={new Date().toISOString().split("T")[0]}
                />
              </Field>

              <Field label="Select Time Window Slot">
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { slot: "Morning", time: "7am - 10am" },
                    { slot: "Midday", time: "11am - 2pm" },
                    { slot: "Afternoon", time: "3pm - 6pm" },
                    { slot: "Evening", time: "7pm - 10pm" }
                  ].map((s) => (
                    <button
                      key={s.slot}
                      type="button"
                      onClick={() => setForm({ ...form, timeSlot: s.slot as "Morning" | "Midday" | "Afternoon" | "Evening" })}
                      className={`text-[10px] py-1.5 px-2 rounded border flex flex-col items-center justify-center transition-all ${
                        form.timeSlot === s.slot 
                          ? "bg-gold/20 text-gold border-gold font-bold" 
                          : "bg-black/30 text-cream-50 border-white/10 hover:border-white/30"
                      }`}
                    >
                      <span className="font-semibold">{s.slot}</span>
                      <span className="text-[8px] opacity-60">{s.time}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-4">
              <button className="nav-cta w-full" type="submit" disabled={loading}>
                {loading ? "Scheduling..." : `Schedule My ${form.sessionFormat} Demo Session`}
              </button>
              {confirmation ? <p className="success-text mt-3">{confirmation}</p> : null}
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div className="dash-card rounded-xl border-gold/15 bg-black/40 text-center">
            <span className="text-[10px] uppercase font-bold text-gold tracking-widest bg-gold/10 px-2 py-0.5 rounded">Demo Preview</span>
            <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/2">
              <div className="text-sm font-semibold text-white">{form.discipline}</div>
              <div className="text-xs text-cream-50 opacity-60 mt-1">Class Level: {form.skillLevel}</div>
              <div className="text-xs text-gold/90 font-semibold mt-1">Format: {form.sessionFormat} Session</div>
              <div className="text-xs text-gold font-semibold mt-3">📅 {form.date || "Select Date"}</div>
              <div className="text-xs text-cream-50 font-mono mt-1">🕒 {form.timeSlot} Session</div>
            </div>
            
            <div className="border-t border-white/10 mt-6 pt-6 text-left space-y-4">
              <div className="flex gap-3 items-start">
                <span className="text-gold text-lg">🎓</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Top-Tier Indian Gurus</h4>
                  <p className="text-[11px] opacity-60 leading-relaxed mt-0.5">Learn under verified classical masters with years of teaching experience.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-gold text-lg">💻</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Dynamic 1-on-1 Live Class</h4>
                  <p className="text-[11px] opacity-60 leading-relaxed mt-0.5">Full interactive virtual classroom with screen sharing and high quality audio streaming.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-gold text-lg">📊</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Detailed Practice Assessments</h4>
                  <p className="text-[11px] opacity-60 leading-relaxed mt-0.5">Get a customized practice syllabus matching your baseline capability score.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/* ── General Contact Page ────────────────────────────────── */

function ContactPage({
  createEnquiry
}: {
  createEnquiry: (input: EnquiryInput, skipWhatsApp?: boolean) => Promise<Enquiry>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.name.trim().length < 2) err.name = "Enter your name.";
    if (!validateEmail(form.email)) err.email = "Enter a valid email.";
    if (form.phone.trim().length < 7) err.phone = "Enter a valid phone number.";
    if (form.subject.trim().length < 3) err.subject = "Enter a subject.";
    if (form.message.trim().length < 5) err.message = "Enter a message.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setLoading(true);
    await createEnquiry({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
      source: "contact"
    }, false); // Direct user to WhatsApp lead conversation
    setLoading(false);
    setConfirmation("Inquiry submitted successfully!");
    setForm({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    });
  };

  return (
    <PageShell kicker="Contact Us" title="We'd love to hear from you.">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] text-left">
        <div className="dash-card rounded-xl border-gold/15 bg-gradient-to-br from-gold/5 to-transparent">
          <h3 className="mb-4 text-gold">✉️ Send a Message</h3>
          <p className="text-xs opacity-75 mb-6">Have questions about class schedules, custom batches, group sessions or curriculum? Let us know below.</p>
          
          <form className="grid gap-5" onSubmit={submit} noValidate>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Full Name" error={errors.name}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </Field>
            </div>

            <Field label="Inquiry Subject" error={errors.subject}>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help you?" />
            </Field>

            <Field label="Detailed Message" error={errors.message} wide>
              <textarea 
                value={form.message} 
                onChange={(e) => setForm({ ...form, message: e.target.value })} 
                placeholder="Describe your inquiry..."
                rows={5}
                className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-cream-50 focus:border-gold/50 focus:outline-none transition w-full font-sans"
              />
            </Field>

            <div className="mt-2">
              <button className="nav-cta w-full" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Submit Inquiry on WhatsApp"}
              </button>
              {confirmation ? <p className="success-text mt-3">{confirmation}</p> : null}
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-6">
          <div className="dash-card rounded-xl border-gold/15 bg-black/40 p-6 space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-gold tracking-widest bg-gold/10 px-2 py-0.5 rounded">Contact Coordinates</span>
              <p className="text-[11px] opacity-60 mt-3">Direct channels for swift support and assistance.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <span className="text-gold text-base">📞</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Call/WhatsApp</h4>
                  <p className="text-[11px] opacity-60 mt-0.5">+91 72007 47726</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-gold text-base">✉️</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Email Address</h4>
                  <p className="text-[11px] opacity-60 mt-0.5">contact@saimusicacademy.com</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-gold text-base">📍</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Location</h4>
                  <p className="text-[11px] opacity-60 mt-0.5">Chennai, Tamil Nadu, India</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
              <a href="https://api.whatsapp.com/send?phone=917200747726&text=Hello%20Sai%20Music%20Academy!%20I%20have%20an%20inquiry." target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 transition-all py-2 rounded-lg text-xs font-semibold">
                💬 Chat on WhatsApp
              </a>
              <a href="mailto:contact@saimusicacademy.com" className="flex items-center justify-center gap-2 bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 transition-all py-2 rounded-lg text-xs font-semibold">
                ✉️ Send direct Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/* ── Auth Page ────────────────────────────────────────── */

function AuthPage({ users, setUsers, setUser, pushToast, setSubscription }: { users: User[]; setUsers: (fn: (u: User[]) => User[]) => void; setUser: (u: User) => void; pushToast: (k: ToastKind, m: string) => void; setSubscription: (s: Subscription | null) => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillCredentials = (role: "admin" | "student" | "teacher") => {
    if (role === "admin") {
      setForm({ name: "Academy Admin", email: "admin@saimusicacademy.com", phone: "+91 98765 43210", password: "admin123" });
      setMode("login");
    } else if (role === "student") {
      setForm({ name: "Ramesh Kumar", email: "student@saimusicacademy.com", phone: "+91 98450 12345", password: "student123" });
      setMode("login");
    } else {
      setForm({ name: "Guru Shankar", email: "teacher@saimusicacademy.com", phone: "+91 99999 88888", password: "teacher123" });
      setMode("login");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError("");
    const emailLower = form.email.trim().toLowerCase();
    
    if (!validateEmail(form.email)) { setError("Enter a valid email address."); return; }
    if (mode !== "forgot" && form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup" && form.name.trim().length < 2) { setError("Enter your full name."); return; }
    
    setLoading(true); await sleep(550);
    
    if (mode === "forgot") { 
      setLoading(false); 
      pushToast("success", "Password reset email queued for delivery."); 
      return; 
    }

    // Provision admin dynamically
    if (emailLower === "admin@saimusicacademy.com" && form.password === "admin123") {
      let adminUser = users.find(u => u.email.toLowerCase() === emailLower);
      if (!adminUser) {
        adminUser = { id: uid("user"), name: "Academy Admin", email: "admin@saimusicacademy.com", phone: "+91 98765 43210", role: "admin", createdAt: new Date().toISOString() };
        setUsers(u => [...u, adminUser!]);
      } else if (adminUser.role !== "admin") {
        // Enforce admin role
        adminUser.role = "admin";
        setUsers(u => u.map(x => x.id === adminUser!.id ? { ...x, role: "admin" } : x));
      }
      setUser(adminUser);
      pushToast("success", "Signed in as Admin.");
      window.location.hash = routeHref("dashboard");
      setLoading(false);
      return;
    }

    // Provision teacher dynamically
    if (emailLower === "teacher@saimusicacademy.com" && form.password === "teacher123") {
      let teacherUser = users.find(u => u.email.toLowerCase() === emailLower);
      if (!teacherUser) {
        teacherUser = { id: uid("user"), name: "Guru Shankar", email: "teacher@saimusicacademy.com", phone: "+91 99999 88888", role: "teacher", createdAt: new Date().toISOString() };
        setUsers(u => [...u, teacherUser!]);
      } else if (teacherUser.role !== "teacher") {
        teacherUser.role = "teacher";
        setUsers(u => u.map(x => x.id === teacherUser!.id ? { ...x, role: "teacher" } : x));
      }
      setUser(teacherUser);
      pushToast("success", "Signed in as Teacher (Guru).");
      window.location.hash = routeHref("dashboard");
      setLoading(false);
      return;
    }

    // Provision student dynamically
    if (emailLower === "student@saimusicacademy.com" && form.password === "student123") {
      let studentUser = users.find(u => u.email.toLowerCase() === emailLower);
      const mockSub: Subscription = {
        id: uid("sub"),
        planId: "starter",
        cycle: "monthly",
        status: "active",
        startedAt: new Date().toISOString(),
        nextRenewal: addDays(new Date(), 30),
        paymentMethod: "card",
        amount: 1499
      };
      if (!studentUser) {
        studentUser = { id: uid("user"), name: "Ramesh Kumar", email: "student@saimusicacademy.com", phone: "+91 98450 12345", role: "member", createdAt: new Date().toISOString(), planId: "starter", subStatus: "active" };
        setUsers(u => [...u, studentUser!]);
        setSubscription(mockSub);
      } else {
        setSubscription(mockSub);
        if (!studentUser.planId) {
          setUsers(u => u.map(x => x.id === studentUser!.id ? { ...x, planId: "starter", subStatus: "active" } : x));
        }
      }
      setUser(studentUser);
      pushToast("success", "Signed in as Student.");
      window.location.hash = routeHref("dashboard");
      setLoading(false);
      return;
    }

    const existing = users.find((u) => u.email.toLowerCase() === emailLower);
    
    if (mode === "login") {
      if (!existing) { setLoading(false); setError("No account found. Switch to sign up to create one."); return; }
      setUser(existing); pushToast("success", "Signed in successfully."); window.location.hash = routeHref("dashboard");
    } else {
      if (existing) { setLoading(false); setError("An account already exists. Use login instead."); return; }
      const user: User = { id: uid("user"), name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), role: "member", createdAt: new Date().toISOString() };
      setUsers((u) => [...u, user]); setUser(user); pushToast("success", "Account created successfully."); window.location.hash = routeHref("dashboard");
    }
    setLoading(false);
  };

  return (
    <PageShell kicker="Account" title="Authentication-ready login, sign up, and reset flows.">
      <div className="auth-panel">
        <div className="billing-toggle compact">
          {(["login", "signup", "forgot"] as const).map((m) => <button key={m} className={mode === m ? "active" : ""} onClick={() => setMode(m)}>{m}</button>)}
        </div>
        <form className="mt-8 grid gap-5" onSubmit={submit}>
          {mode === "signup" ? <Field label="Full name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field> : null}
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          {mode === "signup" ? <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field> : null}
          {mode !== "forgot" ? <Field label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="nav-cta full" type="submit" disabled={loading}>{loading ? "Please wait..." : mode === "forgot" ? "Send reset link" : mode === "login" ? "Login" : "Create account"}</button>
        </form>
        
        {mode === "login" && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-sm text-cream-50 text-center mb-3">💡 Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              <button className="cta-secondary text-xs py-2 px-1 flex flex-col items-center" onClick={() => fillCredentials("student")}>
                <span className="font-semibold text-white text-[11px]">Student</span>
                <span className="text-[9px] text-cream-50 opacity-60 truncate w-full text-center">student@saimusic...</span>
              </button>
              <button className="cta-secondary text-xs py-2 px-1 flex flex-col items-center border-gold/40 hover:border-gold" onClick={() => fillCredentials("teacher")}>
                <span className="font-semibold text-gold text-[11px]">Guru Portal</span>
                <span className="text-[9px] text-cream-50 opacity-60 truncate w-full text-center">teacher@saimusic...</span>
              </button>
              <button className="cta-secondary text-xs py-2 px-1 flex flex-col items-center border-white/20 hover:border-white" onClick={() => fillCredentials("admin")}>
                <span className="font-semibold text-white text-[11px]">SaaS Admin</span>
                <span className="text-[9px] text-cream-50 opacity-60 truncate w-full text-center">admin@saimusic...</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

/* ── Dashboard Page ───────────────────────────────────── */

function DashboardPage({
  user,
  subscription,
  enquiries,
  tickets,
  users,
  setUser,
  updateUser,
  signOut,
  assignments,
  setAssignments,
  practiceLogs,
  setPracticeLogs,
  setTickets,
  setSubscription,
  setUsers,
  pushToast,
  demoBookings,
}: {
  user: User | null;
  subscription: Subscription | null;
  enquiries: Enquiry[];
  tickets: Ticket[];
  users: User[];
  setUser: (u: User) => void;
  updateUser: (u: User) => void;
  signOut: () => void;
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  practiceLogs: PracticeLog[];
  setPracticeLogs: React.Dispatch<React.SetStateAction<PracticeLog[]>>;
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription | null>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  pushToast: (k: ToastKind, m: string) => void;
  demoBookings: DemoBooking[];
}) {
  const [profile, setProfile] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  const [tab, setTab] = useState<"syllabus" | "assignments" | "practice" | "support">("syllabus");
  const [adminTab, setAdminTab] = useState<"telemetry" | "users" | "tickets" | "leads" | "demo-bookings">("telemetry");

  useEffect(() => {
    setProfile({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  }, [user]);

  // Support state hooks for student
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"normal" | "urgent">("normal");
  const [ticketLoading, setTicketLoading] = useState(false);

  // Homework state hooks for student
  const [homeworkSubmissions, setHomeworkSubmissions] = useState<Record<string, string>>({});

  // Practice state hooks for student
  const [practiceDuration, setPracticeDuration] = useState("");
  const [practiceNotes, setPracticeNotes] = useState("");

  // Grading state hooks for teacher
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [teacherGrade, setTeacherGrade] = useState("A+");
  const [teacherFeedback, setTeacherFeedback] = useState("");

  // Shruthi Drone Web Audio state hooks
  const [isPlayingDrone, setIsPlayingDrone] = useState(false);
  const [dronePitch, setDronePitch] = useState("C");
  const [droneVolume, setDroneVolume] = useState(0.5);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);

  // Admin states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");

  // Clean up drone on unmount
  useEffect(() => {
    return () => {
      try {
        if (osc1Ref.current) osc1Ref.current.stop();
        if (osc2Ref.current) osc2Ref.current.stop();
      } catch (e) {}
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  if (!user) {
    return (
      <PageShell kicker="Protected" title="Sign in to access this area.">
        <a className="nav-cta" href={routeHref("login")}>Go to login</a>
      </PageShell>
    );
  }

  const activePlan = subscription ? getPlan(subscription.planId) : null;
  const userTickets = tickets.filter((t) => t.email.toLowerCase() === user.email.toLowerCase());
  const userEnquiries = enquiries.filter((eq) => eq.email.toLowerCase() === user.email.toLowerCase());

  // Shruthi Drone Web Audio setup
  const pitchFreqs: Record<string, number> = {
    C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13, E: 329.63,
    F: 349.23, "F#": 369.99, G: 392.00, "G#": 415.30, A: 440.00,
    "A#": 466.16, B: 493.88
  };

  const toggleDrone = () => {
    if (isPlayingDrone) {
      try {
        if (osc1Ref.current) osc1Ref.current.stop();
        if (osc2Ref.current) osc2Ref.current.stop();
      } catch (e) {}
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
      osc1Ref.current = null;
      osc2Ref.current = null;
      gainNodeRef.current = null;
      audioCtxRef.current = null;
      setIsPlayingDrone(false);
      pushToast("info", "Shruthi drone stopped.");
    } else {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const baseFreq = pitchFreqs[dronePitch] || 261.63;
        const fifthFreq = baseFreq * 1.5;

        const osc1 = ctx.createOscillator();
        osc1.type = "triangle";
        osc1.frequency.value = baseFreq;

        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.value = fifthFreq;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(droneVolume * 0.4, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        osc1Ref.current = osc1;
        osc2Ref.current = osc2;
        gainNodeRef.current = gainNode;
        setIsPlayingDrone(true);
        pushToast("success", `Shruthi Drone playing in pitch ${dronePitch} (Sa-Pa).`);
      } catch (err) {
        pushToast("error", "Failed to start Shruthi Drone: AudioContext not supported.");
      }
    }
  };

  const adjustVolume = (vol: number) => {
    setDroneVolume(vol);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(vol * 0.4, audioCtxRef.current.currentTime);
    }
  };

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    const updated = { ...user, name: profile.name, email: profile.email, phone: profile.phone };
    setUser(updated);
    updateUser(updated);
  };

  // Student specific handlers
  const studentUnlockedClasses = seedCalendarEvents.filter((evt) => {
    if (!subscription || subscription.status !== "active") return false;
    const tier = subscription.planId;
    if (tier === "scale") return true;
    if (tier === "pro") return evt.planId === "starter" || evt.planId === "pro";
    return evt.planId === "starter";
  });

  const syllabusLessons = {
    starter: [
      { id: "s1", title: "1. Introduction to Shruthi & Swaras", desc: "Understanding Pitch matching and the 7 fundamental notes (Sa Ri Ga Ma Pa Dha Ni).", status: "complete" },
      { id: "s2", title: "2. Sarali Varisai - Speed 1", desc: "Basic scalar exercises at 1 note per beat (60 BPM).", status: "complete" },
      { id: "s3", title: "3. Sarali Varisai - Speed 2", desc: "Scalar exercises at 2 notes per beat. Requires steady Shruthi backdrop.", status: "pending" },
      { id: "s4", title: "4. Janti Varisai Basics", desc: "Introduction to doubled notes (Sa Sa Ri Ri Ga Ga...) and stress techniques.", status: "pending" }
    ],
    pro: [
      { id: "p1", title: "1. Raga Lakshana & Melakarta Scales", desc: "Understanding parent scale families and identifying standard scalar differences.", status: "complete" },
      { id: "p2", title: "2. Raga Yaman Improvisation basics", desc: "Learning key phrases of Raga Yaman, focusing on Arohana rules.", status: "complete" },
      { id: "p3", title: "3. Alankars in Thaat Bilawal", desc: "Mastering complex scalar permutations across standard 16-beat Tala structures.", status: "pending" },
      { id: "p4", title: "4. Intro to Adi Tala subdivisions", desc: "Keeping steady hand-clap counters over 4 subdivision divisions.", status: "pending" }
    ],
    scale: [
      { id: "a1", title: "1. Trinity Grade 3 Classical Performance", desc: "Performance preparation of the Grade 3 piano set piece.", status: "complete" },
      { id: "a2", title: "2. Keyboard Chord Inversions & Harmony", desc: "Learning standard triad inversions and chord-accompanying techniques.", status: "complete" },
      { id: "a3", title: "3. Adi Tala Double-Speed Solkattu", desc: "Reciting complex rhythm syllables at 16 divisions per cycle.", status: "pending" },
      { id: "a4", title: "4. Concert Aalap & Improvisation Masterclass", desc: "Professional stage training and concert recital preparation with Gurus.", status: "pending" }
    ]
  };

  const currentLessons = syllabusLessons[subscription?.planId || "starter"] || syllabusLessons.starter;
  const completedCount = currentLessons.filter(l => l.status === "complete").length;
  const progressPercent = Math.round((completedCount / currentLessons.length) * 100);

  const studentUnlockedAssignments = assignments.filter((asg) => {
    if (!subscription || subscription.status !== "active") return false;
    const tier = subscription.planId;
    if (tier === "scale") return true;
    if (tier === "pro") return asg.planId === "starter" || asg.planId === "pro";
    return asg.planId === "starter";
  });

  const handleAssignmentSubmit = (asgId: string) => {
    const text = homeworkSubmissions[asgId] || "";
    if (text.trim().length < 10) {
      pushToast("error", "Please write a comprehensive homework submission (at least 10 characters).");
      return;
    }
    setAssignments((prev) =>
      prev.map((asg) =>
        asg.id === asgId
          ? { ...asg, status: "submitted", submissionText: text.trim() }
          : asg
      )
    );
    pushToast("success", "Homework submitted successfully! The academy teachers have been notified.");
  };

  const handleLogPractice = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(practiceDuration);
    if (isNaN(mins) || mins <= 0) {
      pushToast("error", "Please enter a valid duration in minutes.");
      return;
    }
    if (practiceNotes.trim().length < 5) {
      pushToast("error", "Please add a brief note about what you practiced (at least 5 characters).");
      return;
    }
    const newLog: PracticeLog = {
      id: uid("log"),
      date: new Date().toISOString().slice(0, 10),
      duration: mins,
      notes: practiceNotes.trim()
    };
    setPracticeLogs((prev) => [newLog, ...prev]);
    setPracticeDuration("");
    setPracticeNotes("");
    pushToast("success", `Successfully logged ${mins} minutes of music practice!`);
  };

  const totalPracticeMins = practiceLogs.reduce((acc, curr) => acc + curr.duration, 0);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketSubject.trim().length < 4 || ticketMessage.trim().length < 10) {
      pushToast("error", "Please enter a valid subject (min 4 chars) and detail your issue (min 10 chars).");
      return;
    }
    setTicketLoading(true);
    await sleep(450);
    const newTicket: Ticket = {
      id: uid("ticket"),
      email: user.email,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      priority: ticketPriority,
      status: "open",
      source: "support",
      createdAt: new Date().toISOString()
    };
    setTickets((prev) => [newTicket, ...prev]);
    setTicketSubject("");
    setTicketMessage("");
    setTicketLoading(false);
    pushToast("success", "Support ticket opened. A master teacher will review and reply shortly.");
  };

  // Admin Specific Handlers
  const totalUsersCount = users.length;
  const memberUsers = users.filter(u => u.role === "member");
  const activeTrialsCount = memberUsers.filter(u => u.subStatus === "trial" || (!u.subStatus && u.email === "student@saimusicacademy.com")).length;
  
  const grossMRR = memberUsers.reduce((sum, u) => {
    const plan = u.planId || (u.email === "student@saimusicacademy.com" ? "starter" : null);
    if (!plan || u.subStatus === "canceled") return sum;
    const planCost = plans.find(p => p.id === plan)?.monthly || 0;
    return sum + planCost;
  }, 0);

  const openTicketsCount = tickets.filter(t => t.status === "open").length;

  const handleRoleChange = (userId: string, newRole: "member" | "admin" | "teacher") => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    pushToast("success", `User role updated to ${newRole}.`);
  };

  const handlePlanChange = (userId: string, newPlan: PlanId | "none") => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const subStatus = newPlan === "none" ? undefined : u.subStatus || "active";
          return { ...u, planId: newPlan === "none" ? undefined : newPlan, subStatus };
        }
        return u;
      })
    );
    pushToast("success", `Subscription plan updated.`);
  };

  const handleStatusChange = (userId: string, newStatus: SubscriptionStatus | "none") => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, subStatus: newStatus === "none" ? undefined : newStatus } : u))
    );
    pushToast("success", `Subscription status updated.`);
  };

  const handleAdminReply = (ticketId: string) => {
    if (adminReplyText.trim().length < 5) {
      pushToast("error", "Please write a comprehensive reply (min 5 characters).");
      return;
    }
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: "closed",
            adminReply: adminReplyText.trim(),
            repliedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );
    setAdminReplyText("");
    setSelectedTicketId(null);
    pushToast("success", "Support ticket resolved and reply sent to student portal.");
  };

  const handleTeacherGrade = (asgId: string) => {
    if (teacherFeedback.trim().length < 8) {
      pushToast("error", "Please write a proper feedback note (min 8 characters).");
      return;
    }
    setAssignments((prev) =>
      prev.map((asg) =>
        asg.id === asgId
          ? { ...asg, status: "graded", grade: teacherGrade, feedback: teacherFeedback.trim() }
          : asg
      )
    );
    setSelectedSubmissionId(null);
    setTeacherGrade("A+");
    setTeacherFeedback("");
    pushToast("success", "Assignment graded and student notified.");
  };

  // Render Teacher (Guru) Portal
  if (user.role === "teacher") {
    const pendingSubmissions = assignments.filter((a) => a.status === "submitted");
    const gradedCount = assignments.filter((a) => a.status === "graded").length;
    return (
      <PageShell kicker="Guru Portal" title={`Welcome, ${user.name} — Teacher Control Desk`}>
        {/* Teacher Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="dash-card rounded-xl text-left">
            <h3>Pending Evaluations</h3>
            <p className="text-3xl font-extrabold text-amber-400 mt-2 font-serif">{pendingSubmissions.length}</p>
            <span className="text-[10px] text-cream-50 opacity-60 mt-1 block">Awaiting your grading</span>
          </div>
          <div className="dash-card rounded-xl text-left">
            <h3>Assignments Graded</h3>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2 font-serif">{gradedCount}</p>
            <span className="text-[10px] text-cream-50 opacity-60 mt-1 block">Total sessions evaluated</span>
          </div>
          <div className="dash-card rounded-xl text-left">
            <h3>Active Students</h3>
            <p className="text-3xl font-extrabold text-gold mt-2 font-serif">{users.filter(u => u.role === "member").length}</p>
            <span className="text-[10px] text-cream-50 opacity-60 mt-1 block">Enrolled in programs</span>
          </div>
          <div className="dash-card rounded-xl text-left border-gold/20 bg-gradient-to-br from-gold/10 to-transparent">
            <h3 className="text-gold">Guru Role</h3>
            <p className="text-xs text-white mt-2 font-semibold">Guru Shankar</p>
            <span className="text-[10px] text-cream-50 opacity-60 mt-1 block">{user.email}</span>
            <button className="text-[10px] mt-3 text-red-400 hover:text-red-300" onClick={signOut}>Sign out</button>
          </div>
        </div>

        {/* Submission Evaluations */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] text-left">
          {/* Left: Submission Queue */}
          <div className="dash-card rounded-xl overflow-y-auto max-h-[600px]">
            <h3 className="mb-4">📋 Student Submissions Queue</h3>
            <p className="text-xs opacity-75 mb-4">Select a submission to open the interactive grading workspace on the right.</p>
            {pendingSubmissions.length > 0 ? (
              <div className="space-y-3">
                {pendingSubmissions.map((asg) => (
                  <div
                    key={asg.id}
                    onClick={() => { setSelectedSubmissionId(asg.id); setTeacherGrade("A+"); setTeacherFeedback(""); }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedSubmissionId === asg.id
                        ? "border-gold bg-gold/10"
                        : "border-white/10 bg-white/3 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">Submitted</span>
                      <span className="text-[10px] text-cream-50 opacity-50">{asg.dueDate}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{asg.title}</h4>
                    <p className="text-[11px] opacity-60 mt-1 italic leading-relaxed">"{asg.submissionText?.slice(0, 80)}..."</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center opacity-50">
                <span className="text-3xl block mb-3">✅</span>
                <p className="text-xs">All submissions have been graded! Great work, Guru.</p>
              </div>
            )}
          </div>

          {/* Right: Grading Workspace */}
          <div className="dash-card rounded-xl text-left">
            {selectedSubmissionId ? (
              (() => {
                const asg = assignments.find((a) => a.id === selectedSubmissionId)!;
                return (
                  <div className="space-y-5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gold tracking-widest bg-gold/10 px-2 py-0.5 rounded">Grading Workspace</span>
                      <h3 className="mt-3 text-white">{asg.title}</h3>
                      <p className="text-xs opacity-60 leading-relaxed mt-1">{asg.description}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15">
                      <span className="text-xs font-semibold text-blue-400 block mb-2">📝 Student's Submission</span>
                      <p className="text-xs text-cream-50 opacity-90 leading-relaxed italic">"{asg.submissionText}"</p>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gold tracking-widest mb-3">Assign Grade</label>
                      <div className="flex flex-wrap gap-2">
                        {["A+", "A", "B+", "B", "C+", "C", "D", "F"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setTeacherGrade(g)}
                            className={`py-1.5 px-4 rounded border font-bold text-sm transition-all ${
                              teacherGrade === g
                                ? g === "A+" || g === "A" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" : g === "B+" || g === "B" ? "bg-blue-500/20 text-blue-400 border-blue-500" : "bg-amber-500/20 text-amber-400 border-amber-500"
                                : "bg-black/30 text-cream-50 border-white/10 hover:border-white/30"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gold tracking-widest mb-2">Personal Feedback Note</label>
                      <textarea
                        rows={4}
                        placeholder="Write personalized guidance for the student's next practice session..."
                        value={teacherFeedback}
                        onChange={(e) => setTeacherFeedback(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-lg p-3 text-xs w-full text-white placeholder-cream-50/40 focus:border-gold/50 focus:outline-none transition"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        className="nav-cta text-xs py-2.5 px-4 font-bold flex-1"
                        onClick={() => handleTeacherGrade(asg.id)}
                      >
                        Submit Evaluation & Notify Student
                      </button>
                      <button
                        className="cta-secondary text-xs py-2.5 px-4 font-bold"
                        onClick={() => setSelectedSubmissionId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-50">
                <span className="text-4xl mb-4">🎓</span>
                <p className="text-xs">Select a student submission from the queue to open the Guru evaluation console.</p>
              </div>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  // Render Admin View
  if (user.role === "admin") {
    return (
      <PageShell kicker="SaaS Admin" title={`SaaS Operations Console`}>
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto gap-4 scrollbar-hide">
          {(["telemetry", "users", "tickets", "leads", "demo-bookings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAdminTab(t)}
              className={`pb-4 px-2 font-semibold text-sm capitalize relative transition-all whitespace-nowrap ${
                adminTab === t ? "text-gold border-b-2 border-gold font-bold" : "text-cream-50 opacity-60 hover:opacity-100"
              }`}
            >
              {t === "telemetry" ? "📊 Financial Telemetry" : t === "users" ? "👥 Users Ledger" : t === "tickets" ? "🎟️ Ticketing Helpdesk" : t === "leads" ? "⚡ Leads Pipeline" : "🎯 Demo Bookings"}
            </button>
          ))}
        </div>

        {adminTab === "telemetry" && (
          <div className="space-y-8">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="dash-card rounded-xl text-left">
                <h3>Gross SaaS MRR</h3>
                <p className="text-3xl font-extrabold text-gold mt-2 font-serif">{formatMoney(grossMRR)}</p>
                <span className="text-[10px] text-cream-50 opacity-60 mt-1 block">Live monthly ledger run-rate</span>
              </div>
              <div className="dash-card rounded-xl text-left">
                <h3>Total Registrations</h3>
                <p className="text-3xl font-extrabold text-white mt-2 font-serif">{totalUsersCount}</p>
                <span className="text-[10px] text-cream-50 opacity-60 mt-1 block">Users registered in system</span>
              </div>
              <div className="dash-card rounded-xl text-left">
                <h3>Active Trials</h3>
                <p className="text-3xl font-extrabold text-amber-400 mt-2 font-serif">{activeTrialsCount}</p>
                <span className="text-[10px] text-cream-50 opacity-60 mt-1 block">Students in trial window</span>
              </div>
              <div className="dash-card rounded-xl text-left">
                <h3>Active Support queue</h3>
                <p className="text-3xl font-extrabold text-red-400 mt-2 font-serif">{openTicketsCount}</p>
                <span className="text-[10px] text-cream-50 opacity-60 mt-1 block">Unresolved student tickets</span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="dash-card rounded-xl text-left">
                <h3>Real-Time Operational Insights</h3>
                <p className="text-xs leading-relaxed opacity-75 mt-3">
                  This administrative panel compiles live transactional and operational telemetry directly from user state buffers.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-lg bg-white/3 border border-white/5 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-xs text-white">Academy Database (LocalStorage)</h5>
                      <p className="text-[10px] text-cream-50 opacity-60 mt-1">Fully persistent across browser reloads</p>
                    </div>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">HEALTHY</span>
                  </div>
                  <div className="p-4 rounded-lg bg-white/3 border border-white/5 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-xs text-white">Stripe Test-Mode Webhooks</h5>
                      <p className="text-[10px] text-cream-50 opacity-60 mt-1">Simulated 3-step checkout authorizations</p>
                    </div>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">CONNECTED</span>
                  </div>
                  <div className="p-4 rounded-lg bg-white/3 border border-white/5 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-xs text-white">Vercel Auto-Sync Deployer</h5>
                      <p className="text-[10px] text-cream-50 opacity-60 mt-1">Pushes code revisions to cloud edge</p>
                    </div>
                    <span className="text-xs bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded font-bold">MONITORED</span>
                  </div>
                </div>
              </div>
              
              <div className="dash-card rounded-xl text-left">
                <h3>Quick Profile Management</h3>
                <form className="mt-5 grid gap-4" onSubmit={saveProfile}>
                  <Field label="Admin Name"><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white" /></Field>
                  <Field label="Admin Email"><input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white animate-fade-in" /></Field>
                  <Field label="Admin Phone"><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white" /></Field>
                  <div className="flex gap-3">
                    <button className="nav-cta text-xs py-2 px-4" type="submit">Save Profile</button>
                    <button className="cta-secondary text-xs py-2 px-4" type="button" onClick={signOut}>Sign Out</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {adminTab === "users" && (
          <div className="dash-card rounded-xl text-left overflow-x-auto">
            <h3 className="mb-4">System User Ledger</h3>
            <p className="text-xs opacity-75 mb-6">Manually toggle administrative clearance, modify subscription plans, or adjust status tiers. Modifications update the sandbox immediately.</p>
            
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-cream-50 opacity-80">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">User Details</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">System Role</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Subscription Plan</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Billing Status</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const currentPlanVal = u.planId || (u.email === "student@saimusicacademy.com" ? "starter" : "none");
                  const currentStatusVal = u.subStatus || (u.email === "student@saimusicacademy.com" ? "active" : "none");

                  return (
                    <tr key={u.id} className="hover:bg-white/2 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="opacity-60 mt-0.5 text-[10px]">{u.email}</div>
                        <div className="opacity-60 text-[10px]">{u.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as "member" | "admin" | "teacher")}
                          className="bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                        >
                          <option value="member">Student</option>
                          <option value="teacher">Guru / Teacher</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={currentPlanVal}
                          onChange={(e) => handlePlanChange(u.id, e.target.value as PlanId | "none")}
                          className="bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] text-gold focus:outline-none font-semibold"
                        >
                          <option value="none">None (Unsubscribed)</option>
                          <option value="starter">Beginner (1499/mo)</option>
                          <option value="pro">Intermediate (2999/mo)</option>
                          <option value="scale">Advanced (7499/mo)</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={currentStatusVal}
                          onChange={(e) => handleStatusChange(u.id, e.target.value as SubscriptionStatus | "none")}
                          className="bg-black/60 border border-white/10 rounded px-2 py-1 text-[11px] text-cream-50 focus:outline-none"
                        >
                          <option value="none">Inactive</option>
                          <option value="trial">Trialing</option>
                          <option value="active">Active Plan</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 opacity-75 font-mono text-[10px]">
                        {u.createdAt.slice(0, 10)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {adminTab === "tickets" && (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] text-left">
            <div className="dash-card rounded-xl">
              <h3>Support Helpdesk Inbox</h3>
              <p className="text-xs opacity-75 mb-5">Click on a student's support ticket to read details, review user accounts, and resolve questions.</p>
              
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {tickets.length > 0 ? (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTicketId(t.id);
                        setAdminReplyText(t.adminReply || "");
                      }}
                      className={`p-4 rounded-xl cursor-pointer transition border text-xs flex flex-col gap-2 ${
                        selectedTicketId === t.id
                          ? "bg-gold/5 border-gold shadow-[0_0_15px_rgba(212,168,83,0.1)]"
                          : t.status === "closed"
                          ? "bg-white/2 border-white/5 opacity-70 hover:opacity-100"
                          : "bg-white/4 border-white/10 hover:border-gold/30"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{t.subject}</span>
                        <div className="flex gap-2">
                          <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            t.priority === "urgent" ? "bg-red-500/10 text-red-400" : "bg-white/10 text-cream-50"
                          }`}>
                            {t.priority}
                          </span>
                          <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                            t.status === "closed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {t.status === "closed" ? "Resolved" : "Open"}
                          </span>
                        </div>
                      </div>
                      <p className="text-cream-50 opacity-80 line-clamp-2 leading-relaxed">{t.message}</p>
                      <div className="flex justify-between text-[9px] opacity-60">
                        <span>User: {t.email}</span>
                        <span>Opened: {t.createdAt.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs opacity-50 text-center py-8 italic">No ticket records in support inbox.</p>
                )}
              </div>
            </div>

            <div className="dash-card rounded-xl">
              <h3>Support Resolution Workspace</h3>
              {selectedTicketId ? (
                (() => {
                  const t = tickets.find((x) => x.id === selectedTicketId);
                  if (!t) return <p className="text-xs opacity-50 italic">Ticket not found.</p>;
                  return (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-4 rounded-lg bg-white/3 border border-white/5">
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-white text-xs">{t.subject}</span>
                          <span className="text-[10px] opacity-60">Ticket: {t.id}</span>
                        </div>
                        <p className="text-xs text-cream-50 leading-relaxed mb-3">"{t.message}"</p>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className="bg-white/5 px-2 py-0.5 rounded text-cream-50">Student: {t.email}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded text-cream-50">Source: {t.source}</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded text-cream-50">Priority: {t.priority}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-cream-50 font-bold uppercase tracking-wider block">Guru Reply & Academy Feedback</label>
                        <textarea
                          placeholder="Type response and learning guidelines here. When you submit, the ticket resolves and syncs back to the student's dashboard in real-time."
                          rows={6}
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          className="bg-black/30 border border-white/10 rounded-lg p-3 text-xs w-full text-white placeholder-cream-50/40 focus:border-gold/50 focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          className="nav-cta text-xs py-2.5 px-4 font-bold flex-1"
                          onClick={() => handleAdminReply(t.id)}
                        >
                          Send Reply & Resolve Ticket
                        </button>
                        <button
                          className="cta-secondary text-xs py-2.5 px-4 font-bold"
                          onClick={() => setSelectedTicketId(null)}
                        >
                          Close Workspace
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-50">
                  <svg className="w-10 h-10 text-gold mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-xs">Select a student ticket from the inbox to open the Guru reply console.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {adminTab === "leads" && (
          <div className="dash-card rounded-xl text-left overflow-x-auto">
            <h3 className="mb-4">Admissions & Contact Lead Funnel</h3>
            <p className="text-xs opacity-75 mb-6">Real-time pipeline aggregating contact form enquiries, admissions call-backs, and chatbot human handoff requests.</p>
            
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-cream-50 opacity-80">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Lead Info</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Source Channel</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Subject & Query</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Received Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {enquiries.length > 0 ? (
                  enquiries.map((eq) => (
                    <tr key={eq.id} className="hover:bg-white/2 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{eq.name}</div>
                        <div className="opacity-60 mt-0.5 text-[10px]">{eq.email}</div>
                        <div className="opacity-60 text-[10px]">{eq.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          eq.source === "contact"
                            ? "bg-purple-500/10 text-purple-400"
                            : eq.source === "chatbot"
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-gold/10 text-gold"
                        }`}>
                          {eq.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-cream-20">{eq.subject}</div>
                        <p className="opacity-70 text-[11px] leading-relaxed mt-1 whitespace-pre-line">"{eq.message}"</p>
                      </td>
                      <td className="py-3.5 px-4 opacity-75 font-mono text-[10px]">
                        {eq.createdAt.slice(0, 10)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-xs opacity-50 py-10 text-center italic">No incoming inquiries or chatbot leads yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {adminTab === "demo-bookings" && (
          <div className="dash-card rounded-xl text-left overflow-x-auto">
            <h3 className="mb-4">🎯 Demo Class Bookings</h3>
            <p className="text-xs opacity-75 mb-6">Incoming demo requests from the Schedule a Demo form — sorted by most recent. Assign teachers and confirm slots directly.</p>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-cream-50 opacity-80">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Student Info</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Discipline</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Level & Slot</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Preferred Date</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {demoBookings.length > 0 ? (
                  demoBookings.map((db) => (
                    <tr key={db.id} className="hover:bg-white/2 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{db.name}</div>
                        <div className="opacity-60 mt-0.5 text-[10px]">{db.email}</div>
                        <div className="opacity-60 text-[10px]">{db.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gold">{db.discipline}</div>
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-gold/10 text-gold mt-1 inline-block">Demo</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{db.skillLevel}</span>
                          <span className="text-[9px] font-bold bg-gold/10 text-gold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {db.sessionFormat || "1-on-1"}
                          </span>
                        </div>
                        <div className="text-[10px] opacity-60 mt-0.5">🕒 {db.timeSlot} Slot</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-gold">{db.date}</div>
                      </td>
                      <td className="py-3.5 px-4 opacity-75 font-mono text-[10px]">
                        {db.createdAt.slice(0, 10)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-xs opacity-50 py-10 text-center italic">No demo bookings yet. Share the Schedule a Demo page link with prospects!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    );
  }

  // Render Member View
  return (
    <PageShell kicker="Dashboard" title={`Welcome back, ${user.name}.`}>
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <div className="dash-card rounded-xl text-left">
          <span className="text-[10px] uppercase font-bold text-gold tracking-widest">Active Plan</span>
          <h4 className="text-xl font-bold text-white mt-1">{activePlan?.name || "None"}</h4>
          <span className="text-[10px] text-cream-50 opacity-60 mt-0.5 block capitalize">
            Status: {subscription?.status || "Unsubscribed"}
          </span>
        </div>
        <div className="dash-card rounded-xl text-left">
          <span className="text-[10px] uppercase font-bold text-gold tracking-widest">Practice Completed</span>
          <h4 className="text-xl font-bold text-white mt-1">{totalPracticeMins} Mins</h4>
          <span className="text-[10px] text-cream-50 opacity-60 mt-0.5 block">Recorded student drills</span>
        </div>
        <div className="dash-card rounded-xl text-left">
          <span className="text-[10px] uppercase font-bold text-gold tracking-widest">My Assignments</span>
          <h4 className="text-xl font-bold text-white mt-1">{studentUnlockedAssignments.filter(a => a.status === "pending").length} Pending</h4>
          <span className="text-[10px] text-cream-50 opacity-60 mt-0.5 block">Waiting for submission</span>
        </div>
        <div className="dash-card rounded-xl text-left">
          <span className="text-[10px] uppercase font-bold text-gold tracking-widest">Support Enquiries</span>
          <h4 className="text-xl font-bold text-white mt-1">{userTickets.length} Opened</h4>
          <span className="text-[10px] text-cream-50 opacity-60 mt-0.5 block">Active support tickets</span>
        </div>
      </div>

      <div className="flex border-b border-white/10 mb-8 overflow-x-auto gap-4 scrollbar-hide">
        {(["syllabus", "assignments", "practice", "support"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-4 px-2 font-semibold text-sm capitalize relative transition-all ${
              tab === t ? "text-gold border-b-2 border-gold font-bold" : "text-cream-50 opacity-60 hover:opacity-100"
            }`}
          >
            {t === "syllabus" ? "📖 Syllabus Progress" : t === "assignments" ? "📝 Assignments" : t === "practice" ? "⏱️ Practice Hub" : "💬 Support Desk"}
          </button>
        ))}
      </div>

      {tab === "syllabus" && (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] text-left">
          <div className="dash-card rounded-xl">
            <h3 className="mb-4">Syllabus Road Map</h3>
            <p className="mb-5 text-sm text-cream-50/70">Your learning journey for the <strong className="text-gold">{activePlan?.name || "Beginner"}</strong> tier.</p>
            
            <div className="mb-6">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Course Progress</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div className="bg-gold h-2.5 rounded-full shadow-[0_0_8px_var(--gold)] transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            <div className="space-y-4">
              {currentLessons.map((l) => (
                <div key={l.id} className="p-4 rounded-lg bg-white/3 border border-white/5 flex gap-3 items-start hover:border-white/10 transition">
                  <div className="mt-1">
                    {l.status === "complete" ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">✓</span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/30">⏳</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{l.title}</h4>
                    <p className="text-xs text-cream-50 opacity-70 mt-1">{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="dash-card rounded-xl">
              <h3>Upcoming Live Classes</h3>
              <p className="text-xs opacity-75 mb-4">Click to join the live studio session. Keep your Shruthi box tuned!</p>
              <div className="space-y-4 mt-2">
                {studentUnlockedClasses.length > 0 ? (
                  studentUnlockedClasses.map((evt) => (
                    <div key={evt.id} className="p-4 rounded-lg bg-white/3 border border-gold/10 hover:border-gold/30 transition">
                      <span className="text-[10px] uppercase font-bold text-gold tracking-widest bg-gold/10 px-2 py-0.5 rounded">
                        {evt.planId} Tier
                      </span>
                      <h4 className="font-bold text-sm text-white mt-2">{evt.title}</h4>
                      <p className="text-xs text-cream-50 opacity-80 mt-1">⏱️ {evt.time}</p>
                      <p className="text-xs text-cream-50 opacity-80">👨‍🏫 Instructor: {evt.instructor}</p>
                      <a
                        href={evt.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="nav-cta text-xs py-2 px-3 inline-block mt-4 w-full text-center hover:shadow-[0_0_12px_rgba(212,168,83,0.3)] transition"
                      >
                        Join Live Class ↗
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs opacity-50">No classes scheduled. Upgrade your plan to unlock interactive classes!</p>
                )}
              </div>
            </div>
            
            <div className="dash-card rounded-xl bg-gradient-to-r from-gold/5 to-transparent border-gold/20">
              <h3>Dashboard Notice</h3>
              <p className="text-xs leading-relaxed opacity-75 mt-2">
                Need to reschedule? Standard users enjoy unlimited class shifts. Changes made inside your student panel automatically sync with Vercel and the administrative ledger in real-time.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "assignments" && (
        <div className="dash-card rounded-xl text-left">
          <h3 className="mb-4">My Homework & Assignments</h3>
          <p className="mb-6 text-sm text-cream-50/70">Submit your homework recordings and view grading/feedback from our Academy Gurus.</p>
          <div className="grid gap-6 md:grid-cols-2">
            {studentUnlockedAssignments.length > 0 ? (
              studentUnlockedAssignments.map((asg) => (
                <div key={asg.id} className="p-5 rounded-xl bg-white/3 border border-white/5 flex flex-col justify-between hover:border-white/10 transition">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] uppercase font-bold text-gold tracking-widest bg-gold/10 px-2 py-0.5 rounded">
                        {asg.planId} Tier
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        asg.status === "graded"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : asg.status === "submitted"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {asg.status}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-base text-white">{asg.title}</h4>
                    <p className="text-xs text-cream-50 opacity-80 mt-2 leading-relaxed">{asg.description}</p>
                    <p className="text-xs text-gold/80 font-semibold mt-3">📅 Due Date: {asg.dueDate}</p>

                    {asg.videoUrl && (
                      <div className="mt-4 rounded-lg overflow-hidden border border-white/10 bg-black/60 shadow-lg relative group">
                        <video src={asg.videoUrl} controls className="w-full max-h-[200px] object-contain bg-black" />
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-gold pointer-events-none">
                          Reference Clip
                        </div>
                      </div>
                    )}

                    {asg.status === "graded" && (
                      <div className="mt-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-emerald-400">🎓 Teacher Evaluation</span>
                          <span className="text-sm font-extrabold text-gold bg-gold/10 px-2.5 py-0.5 rounded">Grade: {asg.grade}</span>
                        </div>
                        <p className="text-xs italic text-cream-50 opacity-90 mt-2 font-serif">"{asg.feedback}"</p>
                      </div>
                    )}

                    {asg.status === "submitted" && (
                      <div className="mt-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/15">
                        <span className="text-xs font-semibold text-blue-400 block mb-1">Your Submission</span>
                        <p className="text-xs text-cream-50 opacity-80 leading-relaxed italic">"{asg.submissionText}"</p>
                      </div>
                    )}
                  </div>

                  {asg.status === "pending" && (
                    <div className="mt-5 pt-4 border-t border-white/5">
                      <textarea
                        placeholder="Type your notes / copy-paste audio link or text recording..."
                        rows={3}
                        value={homeworkSubmissions[asg.id] || ""}
                        onChange={(e) => setHomeworkSubmissions({ ...homeworkSubmissions, [asg.id]: e.target.value })}
                        className="bg-black/30 border border-white/10 rounded-lg p-3 text-xs w-full text-white placeholder-cream-50/40 focus:border-gold/50 focus:outline-none transition mb-3"
                      />
                      <button
                        className="nav-cta text-xs w-full py-2"
                        onClick={() => handleAssignmentSubmit(asg.id)}
                      >
                        Submit Homework
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm opacity-50 text-center py-6 col-span-2">Your plan does not currently support assignments. Join our Beginner, Intermediate, or Advanced tracks to access assignments!</p>
            )}
          </div>
        </div>
      )}

      {tab === "practice" && (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] text-left">
          <div className="dash-card rounded-xl">
            <h3 className="mb-4">🎵 Virtual Shruthi Drone</h3>
            <p className="text-xs opacity-75 mb-6">A vocalist's key practice companion. Synthesizes a beautiful resonant Sa-Pa drone natively in your browser using the Web Audio API.</p>
            
            <div className="flex flex-col items-center justify-center p-6 bg-black/40 border border-white/10 rounded-xl mb-6 relative overflow-hidden">
              {isPlayingDrone && (
                <div className="absolute inset-0 flex justify-around items-end opacity-20 pointer-events-none px-4 pb-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                    <div
                      key={bar}
                      className="bg-gold w-3 rounded-t-sm"
                      style={{
                        height: `${Math.floor(Math.random() * 80) + 15}%`,
                        transition: "height 0.15s ease-in-out",
                        animation: `pulse 0.8s infinite alternate ${bar * 0.08}s`
                      }}
                    ></div>
                  ))}
                </div>
              )}

              <div className={`w-20 h-20 rounded-full border-2 border-gold flex items-center justify-center mb-6 transition shadow-lg ${
                isPlayingDrone ? "shadow-[0_0_25px_rgba(212,168,83,0.4)] bg-gold/10" : "bg-black/20"
              }`}>
                <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mb-4 z-10">
                <div>
                  <label className="text-[10px] text-cream-50 font-bold uppercase tracking-wider block mb-1">Key Pitch (Sa)</label>
                  <select
                    value={dronePitch}
                    onChange={(e) => setDronePitch(e.target.value)}
                    disabled={isPlayingDrone}
                    className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white focus:outline-none disabled:opacity-50"
                  >
                    {Object.keys(pitchFreqs).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-cream-50 font-bold uppercase tracking-wider block mb-1">Volume</label>
                  <div className="flex items-center h-10 gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={droneVolume}
                      onChange={(e) => adjustVolume(parseFloat(e.target.value))}
                      className="w-full accent-gold h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                className={`nav-cta w-full py-3 font-bold z-10 ${isPlayingDrone ? "border border-red-500/40 text-red-400 bg-red-500/5 hover:bg-red-500/10 shadow-none" : ""}`}
                onClick={toggleDrone}
              >
                {isPlayingDrone ? "Stop Shruthi Drone" : "Start Shruthi Drone"}
              </button>
            </div>
          </div>

          <div className="dash-card rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="mb-4">⏱️ Log Practice Session</h3>
              <form onSubmit={handleLogPractice} className="space-y-4">
                <div>
                  <label className="text-[10px] text-cream-50 font-bold uppercase tracking-wider block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={practiceDuration}
                    onChange={(e) => setPracticeDuration(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg p-3 text-xs w-full text-white focus:border-gold/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cream-50 font-bold uppercase tracking-wider block mb-1">Practice Notes / Focus Area</label>
                  <textarea
                    placeholder="What exercises, scales, or ragas did you practice today?"
                    rows={3}
                    value={practiceNotes}
                    onChange={(e) => setPracticeNotes(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg p-3 text-xs w-full text-white focus:border-gold/50 focus:outline-none"
                  />
                </div>
                <button type="submit" className="nav-cta w-full py-2.5 text-xs font-semibold">
                  Log Practice Session
                </button>
              </form>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gold">Recent Practice Timeline</h4>
                <span className="text-[10px] text-cream-50 opacity-60 font-mono">Total: {totalPracticeMins} mins</span>
              </div>
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 text-xs">
                {practiceLogs.length > 0 ? (
                  practiceLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-white/3 border border-white/5 rounded-lg flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold leading-relaxed">{log.notes}</p>
                        <span className="text-[10px] text-cream-50 opacity-55 mt-1 block">📅 logged on {log.date}</span>
                      </div>
                      <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded font-bold">{log.duration}m</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs opacity-50 italic">No practice logs recorded yet. Begin logging practice above!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "support" && (
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] text-left">
          <form className="dash-card rounded-xl" onSubmit={handleCreateTicket}>
            <h3>Open Support Ticket</h3>
            <p className="text-xs opacity-75 mb-5">Have a question about class scheduling, pricing, or need a technical review? Open a ticket below.</p>
            
            <div className="mt-4 space-y-4">
              <Field label="Subject">
                <input
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g., Audio setup help / Schedule query"
                  className="bg-black/30 border border-white/10 rounded-lg p-3 text-xs w-full text-white focus:border-gold/50 focus:outline-none"
                />
              </Field>
              
              <Field label="Priority">
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as "normal" | "urgent")}
                  className="bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white focus:outline-none"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </Field>
              
              <Field label="Detail Message">
                <textarea
                  rows={5}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Please explain in detail what you need assistance with..."
                  className="bg-black/30 border border-white/10 rounded-lg p-3 text-xs w-full text-white focus:border-gold/50 focus:outline-none"
                />
              </Field>
            </div>

            <button className="nav-cta mt-5 w-full py-2.5 font-bold" type="submit" disabled={ticketLoading}>
              {ticketLoading ? "Creating..." : "Submit Support Ticket"}
            </button>
          </form>

          <div className="dash-card rounded-xl">
            <h3>Support Helpdesk History</h3>
            <p className="text-xs opacity-75 mb-5">Your active and historical support requests with Sai Music Academy support gurus.</p>
            
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {userTickets.length > 0 ? (
                userTickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white leading-relaxed">{t.subject}</span>
                      <div className="flex gap-2">
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          t.priority === "urgent" ? "bg-red-500/10 text-red-400" : "bg-white/10 text-cream-50"
                        }`}>
                          {t.priority}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                          t.status === "closed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {t.status === "closed" ? "Resolved" : "Open"}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs opacity-80 leading-relaxed text-cream-50">{t.message}</p>
                    <span className="text-[10px] text-cream-50 opacity-40">Ticket ID: {t.id} — Opened {t.createdAt.slice(0, 10)}</span>

                    {t.adminReply && (
                      <div className="mt-3 p-4 rounded-lg bg-gold/5 border border-gold/20 shadow-[inset_0_0_10px_rgba(212,168,83,0.05)] animate-fade-in text-left">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-extrabold text-gold">💬 Academy Guru Response</span>
                          <span className="text-[10px] text-cream-50 opacity-55">{t.repliedAt?.slice(0, 10)}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-white italic">"{t.adminReply}"</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs opacity-50 text-center py-8 italic">No ticket records. Need help? Create a support request on the left!</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 p-6 dash-card rounded-xl text-left">
        <h3>Academy Profile Details</h3>
        <form className="mt-5 grid gap-4 lg:grid-cols-3" onSubmit={saveProfile}>
          <Field label="Name"><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white" /></Field>
          <Field label="Email"><input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white" /></Field>
          <Field label="Phone"><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white" /></Field>
        </form>
        <div className="mt-5 flex gap-3">
          <button className="nav-cta text-xs py-2 px-4" onClick={saveProfile}>Save Profile</button>
          <button className="cta-secondary text-xs py-2 px-4" onClick={signOut}>Sign Out</button>
        </div>
      </div>
    </PageShell>
  );
}

/* ── Billing Page ─────────────────────────────────────── */

function BillingPage({ user, subscription, setSubscription, openCheckout, pushToast }: { user: User | null; subscription: Subscription | null; setSubscription: (s: Subscription | null) => void; openCheckout: (planId: PlanId, cycle: BillingCycle) => void; pushToast: (k: ToastKind, m: string) => void }) {
  if (!user) return <PageShell kicker="Protected" title="Sign in to access this area."><a className="nav-cta" href={routeHref("login")}>Go to login</a></PageShell>;
  const activePlan = subscription ? getPlan(subscription.planId) : null;
  const cancel = () => { if (!subscription) return; setSubscription({ ...subscription, status: "canceled" }); pushToast("info", "Subscription canceled. Access remains until the current renewal date."); };
  const renew = () => { if (!subscription) return; setSubscription({ ...subscription, status: "active", nextRenewal: addDays(new Date(), subscription.cycle === "monthly" ? 30 : 365) }); pushToast("success", "Subscription renewed successfully."); };
  return (
    <PageShell kicker="Billing" title="Manage subscription, renewal, cancellation, and plan changes.">
      <div className="billing-panel">
        <div><p className="plan-tag">Current plan</p><h3>{activePlan ? activePlan.name : "No plan selected"}</h3><p>{subscription ? `${subscription.status} subscription paid by ${subscription.paymentMethod}. Amount: ${formatMoney(subscription.amount)}.` : "Start a plan from pricing to activate billing."}</p></div>
        <div className="flex flex-wrap gap-3">
          {subscription ? <button className="nav-cta" onClick={renew}>Renew</button> : null}
          {subscription ? <button className="cta-secondary" onClick={cancel}>Cancel</button> : null}
          <button className="cta-secondary" onClick={() => openCheckout("starter", "monthly")}>Downgrade</button>
          <button className="nav-cta" onClick={() => openCheckout("pro", "yearly")}>Upgrade</button>
        </div>
      </div>
    </PageShell>
  );
}

/* ── Support Page ─────────────────────────────────────── */

function SupportPage({ user, tickets, createTicket }: { user: User | null; tickets: Ticket[]; createTicket: (input: TicketInput) => Promise<Ticket> }) {
  const [form, setForm] = useState({ email: user?.email ?? "", subject: "", message: "", priority: "normal" as "normal" | "urgent" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setForm((c) => ({ ...c, email: user?.email ?? c.email })), [user]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateEmail(form.email) || form.subject.trim().length < 3 || form.message.trim().length < 10) { setError("Enter a valid email, subject, and support message."); return; }
    setError(""); setLoading(true); await createTicket({ ...form, source: "support" }); setLoading(false);
    setForm({ email: user?.email ?? "", subject: "", message: "", priority: "normal" });
  };
  return (
    <PageShell kicker="Support" title="Create tickets, request help, and review support history.">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="dash-card" onSubmit={submit}><h3>Create support ticket</h3><div className="mt-5 grid gap-4"><Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Subject"><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field><Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as "normal" | "urgent" })}><option value="normal">Normal</option><option value="urgent">Urgent</option></select></Field><Field label="Message"><textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field></div>{error ? <p className="error-text">{error}</p> : null}<button className="nav-cta mt-5" type="submit" disabled={loading}>{loading ? "Creating..." : "Create ticket"}</button></form>
        <div className="dash-card"><h3>Recent ticket records</h3><div className="record-list mt-5">{tickets.length ? tickets.slice(0, 6).map((t) => <p key={t.id}><strong>{t.subject}</strong><span>{t.status} - {t.email}</span></p>) : <p>No tickets yet.</p>}</div></div>
      </div>
    </PageShell>
  );
}

/* ── Legal Pages ──────────────────────────────────────── */

function LegalPage({ type }: { type: "terms" | "privacy" }) {
  return (
    <PageShell kicker={type === "terms" ? "Terms" : "Privacy"} title={type === "terms" ? "Clear product terms for a subscription learning platform." : "Privacy-ready structure for user, billing, support, and enquiry data."}>
      <div className="prose-block"><p>This page is structured for legal content, consent language, data retention rules, billing terms, support policies, and user rights.</p><p>Before public launch, connect this page to your approved legal policy, payment processor terms, privacy policy, and regional compliance requirements.</p></div>
    </PageShell>
  );
}

/* ── Gallery Page ─────────────────────────────────────── */

function GalleryPage() {
  const images = [
    { src: "/images/gallery/music-class-1.jpg", alt: "Students learning piano at Sai Music Academy" },
    { src: "/images/gallery/music-class-2.jpg", alt: "Guitar lesson with expert teacher" },
    { src: "/images/gallery/music-class-3.jpg", alt: "Students receiving certificates at award ceremony" },
    { src: "/images/gallery/music-class-4.jpg", alt: "Keyboard recital performance on stage" },
    { src: "/images/gallery/music-class-5.jpg", alt: "Group photo of music academy students" },
    { src: "/images/gallery/music-class-6.jpg", alt: "Mridangam percussion lesson" },
    { src: "/images/gallery/music-class-7.jpg", alt: "Carnatic vocal music training" },
    { src: "/images/gallery/music-class-8.jpg", alt: "Flute lesson at academy" },
    { src: "/images/gallery/music-class-1.jpg", alt: "Violin class with senior student" },
  ];
  return (
    <PageShell kicker="Gallery" title="Our Academy In Pictures">
      <p className="prose-block">Explore live performances, classroom moments, award ceremonies, and student achievements at Sai Music Academy.</p>
      <div className="gallery-grid mt-10">
        {images.map((img, i) => (
          <figure key={i} className="gallery-item"><img src={img.src} alt={img.alt} loading="lazy" /><figcaption>{img.alt}</figcaption></figure>
        ))}
      </div>
      <div className="stats-strip mt-16" style={{ borderRadius: "1.5rem" }}>
        <div><StatCounter target={1000} suffix="+" /><div className="stat-label">Happy Students</div></div>
        <div><StatCounter target={10000} suffix="+" /><div className="stat-label">Classes Completed</div></div>
        <div><StatCounter target={100} suffix="+" /><div className="stat-label">Expert Gurus</div></div>
        <div><StatCounter target={15} suffix="+" /><div className="stat-label">Years Experience</div></div>
      </div>
    </PageShell>
  );
}

/* ── Awards Page ──────────────────────────────────────── */

function AwardsPage() {
  const awards = [
    { title: "Trinity College London Grade 8 Achievement", desc: "Anupama, just 11 years old, became the first youngest kid from Tamil Nadu to finish Grade 8 in the Trinity College of London theory exam in May 2016, from Sai Music Academy.", badge: "Youngest Achiever" },
    { title: "Grade 5 Theory & M.Music Completion", desc: "Guru Pranav successfully completed Grade 5 in Theory and M.Music, demonstrating exceptional dedication and the academy's commitment to producing well-rounded musicians.", badge: "Academic Excellence" },
    { title: "Nallaasiriyar Award — Tamil Nadu Music College", desc: "Our academy received the prestigious Nallaasiriyar (Good Teacher) Award for Tamil Nadu Music College, presented by the Erode Collector and Minister.", badge: "State Recognition" },
    { title: "Trinity College Certificates — Grades 2 to 8", desc: "Multiple students received Trinity College of London certificates ranging from Grade 2 to Grade 8, reflecting our dedication to maintaining international standards.", badge: "International Standard" },
    { title: "Keyboard Practical Exam — Grades 2 to 6", desc: "Our senior students successfully attended and passed keyboard practical exams from Grade 2 to Grade 6, showcasing comprehensive practical training.", badge: "Practical Excellence" },
  ];
  return (
    <PageShell kicker="Awards" title="Our Achievements & Recognition">
      <p className="prose-block">From local community honors to international recognition, Sai Music Academy has earned a prestigious position among musical institutions.</p>
      <div className="awards-list mt-10">
        {awards.map((a, i) => (
          <article key={i} className="award-card" data-reveal>
            <div className="award-badge-wrap"><span className="award-badge">{a.badge}</span></div>
            <div className="award-content"><h3>{a.title}</h3><p>{a.desc}</p></div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

/* ── Checkout Modal ───────────────────────────────────── */

function CheckoutModal({ request, currentUser, onClose, onComplete, pushToast }: { request: CheckoutRequest | null; currentUser: User | null; onClose: () => void; onComplete: (sub: Subscription, user: User) => void; pushToast: (k: ToastKind, m: string) => void }) {
  const plan = request ? getPlan(request.planId) : null;
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [coupon, setCoupon] = useState("");
  const [form, setForm] = useState({ name: currentUser?.name ?? "", email: currentUser?.email ?? "", phone: currentUser?.phone ?? "", card: "", expiry: "", cvc: "", upi: "", wallet: "" });
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"form" | "processing" | "success">("form");
  const [processMsg, setProcessMsg] = useState("Connecting to Stripe Gateway...");

  useEffect(() => { 
    setForm((c) => ({ ...c, name: currentUser?.name ?? c.name, email: currentUser?.email ?? c.email, phone: currentUser?.phone ?? c.phone })); 
  }, [currentUser]);

  if (!request || !plan) return null;

  const discount = couponCodes[coupon.trim().toUpperCase()] ?? 0;
  const base = request.cycle === "monthly" ? plan.monthly : plan.yearly;
  const amount = Math.round(base * (1 - discount / 100));

  // Auto-format card input: "4242 4242 4242 4242"
  const handleCardChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
    setForm({ ...form, card: formatted });
  };

  // Auto-format expiry input: "MM/YY"
  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }
    setForm({ ...form, expiry: formatted });
  };

  // Throw full screen confetti
  const launchConfetti = () => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9999";
    container.style.overflow = "hidden";
    document.body.appendChild(container);

    const colors = ["#D4A853", "#F0C96B", "#ffffff", "#ff4757", "#2ed573", "#1e90ff"];
    for (let i = 0; i < 75; i++) {
      const el = document.createElement("div");
      el.style.position = "absolute";
      el.style.width = `${Math.random() * 8 + 6}px`;
      el.style.height = `${Math.random() * 12 + 6}px`;
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = `${Math.random() * 100}vw`;
      el.style.top = "-20px";
      el.style.borderRadius = "2px";
      el.style.opacity = `${Math.random() * 0.8 + 0.2}`;
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      container.appendChild(el);

      const speed = Math.random() * 3 + 2;
      const rotationSpeed = Math.random() * 10 - 5;
      let top = -20;
      let left = parseFloat(el.style.left);
      
      const frame = setInterval(() => {
        top += speed;
        el.style.top = `${top}px`;
        el.style.transform = `rotate(${top * rotationSpeed}deg)`;
        if (top > window.innerHeight) {
          clearInterval(frame);
          el.remove();
        }
      }, 16);
    }

    setTimeout(() => container.remove(), 5000);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2 || !validateEmail(form.email) || form.phone.trim().length < 7) { setError("Enter name, valid email, and phone before checkout."); return; }
    if (coupon.trim() && discount === 0) { setError("Coupon not recognized. Try SAI20, TRIAL30, or YEARLY10."); return; }
    if (method === "card" && (form.card.replace(/\s/g, "").length < 12 || form.expiry.length < 5 || form.cvc.length < 3)) { setError("Enter valid card number, expiry (MM/YY), and CVC."); return; }
    if (method === "upi" && !form.upi.includes("@")) { setError("Enter a valid UPI ID, for example name@bank."); return; }
    if (method === "wallet" && form.wallet.trim().length < 3) { setError("Enter a wallet identifier."); return; }
    
    setError(""); 
    setStage("processing");
    
    // Gateway animation stages
    setProcessMsg("Connecting to Stripe payment gateway...");
    await sleep(900);
    setProcessMsg("Authorizing secure test transaction...");
    await sleep(1000);
    setProcessMsg("Generating subscription records in database...");
    await sleep(800);
    
    setStage("success");
    launchConfetti();
    pushToast("success", `${plan.name} enrollment complete. Your classical journey begins!`);
    await sleep(2200);

    const user: User = currentUser ?? { id: uid("user"), name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), role: "member", createdAt: new Date().toISOString() };
    const sub: Subscription = { id: uid("sub"), planId: plan.id, cycle: request.cycle, status: "trial", coupon: coupon.trim().toUpperCase() || undefined, startedAt: new Date().toISOString(), nextRenewal: addDays(new Date(), plan.trialDays), paymentMethod: method, amount };
    
    // Store in localStorage for absolute zero-cost persistence
    localStorage.setItem("sai-subscription", JSON.stringify(sub));
    
    onComplete(sub, user);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      {stage === "form" && (
        <form className="checkout-modal animate-fade-in" onSubmit={submit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="plan-tag text-gold">Secure Stripe Checkout</p>
              <h3 className="plan-name">{plan.name}</h3>
              <p className="text-sm opacity-80">{formatMoney(amount)} / {request.cycle}. {plan.trialDays}-day trial starts today.</p>
            </div>
            <button className="close-btn" type="button" onClick={onClose}>✕</button>
          </div>
          
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Coupon Code"><input placeholder="e.g. SAI20" value={coupon} onChange={(e) => setCoupon(e.target.value)} /></Field>
          </div>
          
          <div className="payment-methods" role="group">
            {(["card", "upi", "wallet"] as PaymentMethod[]).map((m) => (
              <button key={m} className={method === m ? "active" : ""} type="button" onClick={() => setMethod(m)}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          
          {method === "card" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Card number" wide>
                <input placeholder="4242 4242 4242 4242" inputMode="numeric" value={form.card} onChange={(e) => handleCardChange(e.target.value)} />
              </Field>
              <Field label="Expiry (MM/YY)">
                <input placeholder="MM/YY" value={form.expiry} onChange={(e) => handleExpiryChange(e.target.value)} />
              </Field>
              <Field label="CVC">
                <input placeholder="123" inputMode="numeric" type="password" value={form.cvc} onChange={(e) => setForm({ ...form, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
              </Field>
              <div className="sm:col-span-3 bg-white/5 border border-white/10 rounded p-2.5 text-[11px] text-cream-50 opacity-80 flex items-center gap-2">
                <span className="text-gold">💡</span> Use Stripe test credentials: any card number starting with <strong>4242</strong>, any expiry, and any CVC code.
              </div>
            </div>
          )}
          
          {method === "upi" && (
            <Field label="UPI ID"><input placeholder="yourname@okhdfcbank" value={form.upi} onChange={(e) => setForm({ ...form, upi: e.target.value })} /></Field>
          )}
          
          {method === "wallet" && (
            <Field label="Wallet phone account"><input placeholder="e.g. +91 99999 88888" value={form.wallet} onChange={(e) => setForm({ ...form, wallet: e.target.value })} /></Field>
          )}
          
          {discount ? <p className="success-text text-xs">🎉 Coupon code applied successfully! {discount}% discount deducted from base price.</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          
          <button className="nav-cta full mt-5" type="submit">
            Start {plan.trialDays}-Day Free Trial
          </button>
          
          <p className="fine-print text-center mt-3 opacity-60">🛡️ Instant enrollment. Cancel anytime during the trial. Zero charges.</p>
        </form>
      )}

      {stage === "processing" && (
        <div className="checkout-modal flex flex-col items-center justify-center py-12 text-center animate-fade-in">
          <div className="payment-spinner relative w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-bold mb-2">Processing Enrollment</h3>
          <p className="text-sm text-cream-50 opacity-80">{processMsg}</p>
        </div>
      )}

      {stage === "success" && (
        <div className="checkout-modal flex flex-col items-center justify-center py-12 text-center animate-fade-in border-gold/40">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(212,168,83,0.5)]">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gold mb-2">Welcome to Sai Music Academy!</h3>
          <p className="text-sm text-cream-50 opacity-90 max-w-sm">Transaction Approved. Your {plan.name} free trial is now active. Launching your student classroom...</p>
        </div>
      )}
    </div>
  );
}

/* ── Chatbot ──────────────────────────────────────────── */

function Chatbot({ user, createTicket, createEnquiry }: { user: User | null; createTicket: (input: TicketInput) => Promise<Ticket>; createEnquiry: (input: EnquiryInput, skipWhatsApp?: boolean) => Promise<Enquiry> }) {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useStoredState<string>("sai-gemini-key", "");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [messages, setMessages] = useStoredState<ChatMessage[]>("sai-chat-log", [{ id: uid("chat"), sender: "bot", text: "🎶 Namaste! I'm Sai, your virtual music guide. I can help with our 22 classical programs, pricing, trial details, or connect you with a teacher. How may I assist you today?", createdAt: new Date().toISOString() }]);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"idle" | "handoff" | "lead">("idle");
  const [botTyping, setBotTyping] = useState(false);
  const [handoff, setHandoff] = useState({ email: user?.email ?? "", issue: "" });
  const [lead, setLead] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const add = (s: "bot" | "user", t: string) => setMessages((m) => [...m, { id: uid("chat"), sender: s, text: t, createdAt: new Date().toISOString() }]);

  const SYSTEM_PROMPT = `You are Sai, the warm and knowledgeable virtual music guide for Sai Music Academy — a premier online Indian Classical music education platform. 
You have expertise in all 22 disciplines offered: Carnatic Vocal, Hindustani Vocal, Western Vocal, Mridangam, Tabla, Ghatam, Kanjira, Konnakol, Cajon, Morsing, Veena, Violin, Flute, Keyboard, Guitar, Sitar, Mandolin, Saxophone, Harmonium, Recorder, Bharatanatyam, and Yoga.
Membership plans: Beginner (INR 1,499/month, 14-day free trial), Intermediate (INR 2,999/month, 14-day trial), Advanced (INR 7,499/month, 7-day trial). All plans are billed monthly or yearly (10% off).
Coupon codes available: SAI20 (20% off), TRIAL30 (extend trial 30 days), YEARLY10 (10% yearly discount).
Key features: 1-on-1 live classes, personalized syllabus, homework assignments with teacher grading, practice drone tool, virtual calendar, priority support.
Response style: Warm, professional, informative. Keep replies concise (2-4 sentences max). Use relevant emojis sparingly for warmth.`;

  const sendToGemini = async (userText: string): Promise<string> => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Understood! I'm ready to assist as Sai, the music guide." }] },
        { role: "user", parts: [{ text: userText }] }
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 256 }
    };
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "I couldn't generate a response. Please try again.";
  };

  const offlineFallback = (lower: string): string => {
    if (lower.includes("price") || lower.includes("plan") || lower.includes("cost") || lower.includes("fee"))
      return "💰 Our plans: Beginner (₹1,499/mo, 14-day trial), Intermediate (₹2,999/mo, 14-day trial), Advanced (₹7,499/mo, 7-day trial). Use SAI20 for 20% off!";
    if (lower.includes("course") || lower.includes("discipline") || lower.includes("learn") || lower.includes("teach"))
      return "🎶 We offer 22 disciplines: Carnatic Vocal, Hindustani Vocal, Tabla, Mridangam, Veena, Violin, Flute, Guitar, Sitar, Harmonium, Bharatanatyam & more. Which interests you?";
    if (lower.includes("trial") || lower.includes("free"))
      return "🎁 Beginner & Intermediate plans include a 14-day free trial. Advanced plan has a 7-day trial. No credit card required to start!";
    if (lower.includes("human") || lower.includes("support") || lower.includes("agent"))
      return "I'll connect you with a support agent right away. Click 'Human Handoff' below to create a support ticket!";
    if (lower.includes("demo") || lower.includes("book") || lower.includes("schedule"))
      return "📅 You can schedule a free 1-on-1 demo class! Visit our Contact page and fill the 'Schedule a Demo' form to pick your discipline, level, date, and time slot.";
    if (lower.includes("hindi") || lower.includes("hindustani") || lower.includes("carnatic"))
      return "🎵 Both Carnatic and Hindustani vocal traditions are available! Our Gurus are trained masters in their lineages. Which tradition draws you more?";
    return "I'm here to help! You can ask me about our 22 music programs, membership plans, demo scheduling, or connect you with a live support agent. 🎶";
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || botTyping) return;
    const userMsg = text.trim();
    add("user", userMsg);
    setText("");
    const lower = userMsg.toLowerCase();

    // Check for lead/handoff triggers without AI
    if (lower.includes("human") || lower.includes("agent") || lower.includes("talk to someone")) {
      setMode("handoff");
      add("bot", "I'll connect you with a support agent. Please share your email and issue below.");
      return;
    }
    if (lower.includes("book demo") || lower.includes("schedule demo") || lower.includes("free trial class")) {
      setMode("lead");
      add("bot", "Great! Share your details and our admissions team will arrange a personalized demo class for you.");
      return;
    }

    // Try live Gemini if API key set
    if (apiKey.trim()) {
      setBotTyping(true);
      try {
        const aiReply = await sendToGemini(userMsg);
        setBotTyping(false);
        add("bot", aiReply);
      } catch (err) {
        setBotTyping(false);
        add("bot", "⚠️ AI is temporarily unavailable. " + offlineFallback(lower));
      }
    } else {
      // Offline keyword fallback
      add("bot", offlineFallback(lower));
    }
  };

  const respond = (intent: string) => {
    if (intent === "pricing") add("bot", "💰 Plans: Beginner ₹1,499/mo (14-day trial), Intermediate ₹2,999/mo (14-day trial), Advanced ₹7,499/mo (7-day trial). Use coupon SAI20 for 20% off!");
    if (intent === "courses") add("bot", "🎶 We teach 22 disciplines across Vocals, Percussion, Melodic Instruments, Dance & Wellness. From Carnatic Vocal to Tabla, Guitar to Bharatanatyam!");
    if (intent === "handoff") { setMode("handoff"); add("bot", "I'll create a support ticket and a senior teacher will reach out to you. Please fill your email and issue below."); }
    if (intent === "lead") { setMode("lead"); add("bot", "Wonderful! Share your details below and we'll arrange a personalized free demo class with one of our Gurus."); }
  };

  return (
    <div className="chatbot">
      {open && (
        <div className="chat-window" style={{ display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div className="chat-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🎵</span>
              <strong>Sai AI Assistant</strong>
              {apiKey && <span style={{ fontSize: "9px", background: "rgba(52,211,153,0.15)", color: "#34d399", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>AI ACTIVE</span>}
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => setShowSettings((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "14px", padding: "4px" }}
                title="Gemini AI Settings"
              >
                ⚙️
              </button>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: "16px", padding: "4px" }}>✕</button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: "10px", color: "#d4a853", fontWeight: "bold", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>🔑 Gemini AI Key</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>Enter your free Google AI Studio API key to enable live Gemini AI responses.</p>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="password"
                  placeholder={apiKey ? "Key saved — enter new to update" : "AIza..."}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px 8px", fontSize: "11px", color: "white", outline: "none" }}
                />
                <button
                  onClick={() => { if (apiKeyInput.trim()) { setApiKey(apiKeyInput.trim()); setApiKeyInput(""); add("bot", "✅ Gemini AI activated! Ask me anything about Indian classical music, our 22 programs, pricing, or schedule a demo."); setShowSettings(false); } }}
                  style={{ background: "rgba(212,168,83,0.2)", border: "1px solid rgba(212,168,83,0.4)", borderRadius: "6px", padding: "6px 10px", fontSize: "10px", color: "#d4a853", cursor: "pointer", fontWeight: "bold" }}
                >
                  Save
                </button>
                {apiKey && (
                  <button
                    onClick={() => { setApiKey(""); add("bot", "🔌 AI key removed. Switching to offline response mode."); }}
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "6px 8px", fontSize: "10px", color: "#f87171", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1 }}>
            {messages.slice(-12).map((m) => (
              <p key={m.id} className={`chat-${m.sender}`}>{m.text}</p>
            ))}
            {botTyping && (
              <p className="chat-bot" style={{ opacity: 0.6, fontStyle: "italic" }}>Sai is thinking...</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="quick-replies">
            <button onClick={() => respond("pricing")}>💰 Pricing</button>
            <button onClick={() => respond("courses")}>🎶 Courses</button>
            <button onClick={() => respond("lead")}>📅 Book Demo</button>
            <button onClick={() => respond("handoff")}>🙋 Human Help</button>
          </div>

          {/* Handoff Form */}
          {mode === "handoff" && (
            <form className="chat-form" onSubmit={async (e) => {
              e.preventDefault();
              if (!validateEmail(handoff.email) || handoff.issue.trim().length < 8) return;
              const t = await createTicket({ email: handoff.email, subject: "Chatbot handoff", message: handoff.issue, priority: "normal", source: "chatbot" });
              add("bot", `✅ Support ticket ${t.id} created. A senior teacher will contact you within 24 hours.`);
              setMode("idle");
            }}>
              <input placeholder="Your email" value={handoff.email} onChange={(e) => setHandoff({ ...handoff, email: e.target.value })} />
              <textarea placeholder="Describe your issue..." value={handoff.issue} onChange={(e) => setHandoff({ ...handoff, issue: e.target.value })} />
              <button type="submit">Create Support Ticket</button>
            </form>
          )}

          {/* Lead Form */}
          {mode === "lead" && (
            <form className="chat-form" onSubmit={async (e) => {
              e.preventDefault();
              if (lead.name.trim().length < 2 || !validateEmail(lead.email) || lead.phone.trim().length < 7) return;
              const eq = await createEnquiry({ name: lead.name, email: lead.email, phone: lead.phone, subject: "Chatbot lead — Demo request", message: "Student requested a demo class via chatbot.", source: "chatbot" });
              add("bot", `🎉 Perfect! Lead ${eq.id} saved. Our admissions team will contact you within 12 hours with available demo slots.`);
              setMode("idle");
            }}>
              <input placeholder="Full name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
              <input placeholder="Email address" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
              <input placeholder="Phone number" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
              <button type="submit">Request Demo Class</button>
            </form>
          )}

          {/* Input */}
          <form className="chat-input" onSubmit={send}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={apiKey ? "Ask anything — AI is active 🤖" : "Ask about plans, courses, demo..."}
              disabled={botTyping}
            />
            <button type="submit" disabled={botTyping}>{botTyping ? "..." : "Send"}</button>
          </form>
        </div>
      )}
      <button className="chat-fab" onClick={() => setOpen((v) => !v)}>
        {open ? "✕ Close" : "🎵 Chat"}
      </button>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────── */

export default function App() {
  const [route, navigate] = useRoute();
  const [users, setUsers] = useStoredState<User[]>("sai-users", []);
  const [user, setUser] = useStoredState<User | null>("sai-current-user", null);
  const [subscription, setSubscription] = useStoredState<Subscription | null>("sai-subscription", null);
  const [enquiries, setEnquiries] = useStoredState<Enquiry[]>("sai-enquiries", []);
  const [tickets, setTickets] = useStoredState<Ticket[]>("sai-tickets", []);
  const [assignments, setAssignments] = useStoredState<Assignment[]>("sai-assignments", seedAssignments);
  const [practiceLogs, setPracticeLogs] = useStoredState<PracticeLog[]>("sai-practice-logs", []);
  const [demoBookings, setDemoBookings] = useStoredState<DemoBooking[]>("sai-demo-bookings", []);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [checkout, setCheckout] = useState<CheckoutRequest | null>(null);

  useReveal();

  const pushToast = (kind: ToastKind, message: string) => {
    const t = { id: uid("toast"), kind, message };
    setToasts((x) => [...x, t]);
    window.setTimeout(() => setToasts((x) => x.filter((y) => y.id !== t.id)), 3600);
  };

  const createEnquiry = async (input: EnquiryInput, skipWhatsApp: boolean = false) => {
    const eq: Enquiry = { id: uid("enq"), ...input, createdAt: new Date().toISOString(), adminEmailQueued: true, autoReplyQueued: true };
    setEnquiries((x) => [eq, ...x]);
    pushToast("success", "Enquiry stored and email notifications queued.");
    
    // Dynamic WhatsApp Direct Notification Handoff
    if (!skipWhatsApp) {
      try {
        const waMessage = encodeURIComponent(
          `Hello Sai Music Academy! ✉️\n\nI have submitted an enquiry on your portal:\n\n` +
          `• Name: ${eq.name}\n` +
          `• Email: ${eq.email}\n` +
          `• Phone: ${eq.phone || "Not provided"}\n` +
          `• Subject: ${eq.subject}\n` +
          `• Message: ${eq.message}\n\n` +
          `Please check this lead. Thank you!`
        );
        window.open(`https://api.whatsapp.com/send?phone=917200747726&text=${waMessage}`, "_blank");
      } catch (e) {
        console.error("WhatsApp redirect failed", e);
      }
    }
    
    return eq;
  };

  const createTicket = async (input: TicketInput) => {
    await sleep(450);
    const t: Ticket = { id: uid("ticket"), ...input, status: "open", createdAt: new Date().toISOString() };
    setTickets((x) => [t, ...x]); pushToast("success", "Support ticket created."); return t;
  };

  const createDemoBooking = async (input: Omit<DemoBooking, "id" | "createdAt">) => {
    const db: DemoBooking = { id: uid("demo"), ...input, createdAt: new Date().toISOString() };
    setDemoBookings((x) => [db, ...x]);
    pushToast("success", `Demo booked! Reference ID: ${db.id}`);
    
    // Dynamic WhatsApp Direct Notification Handoff
    try {
      const waMessage = encodeURIComponent(
        `Hello Sai Music Academy! 🎶\n\nI just scheduled a ${db.sessionFormat || "1-on-1"} Demo session on your portal!\n\nDetails:\n` +
        `• Name: ${db.name}\n` +
        `• Email: ${db.email}\n` +
        `• Phone: ${db.phone}\n` +
        `• Program: ${db.discipline}\n` +
        `• Format: ${db.sessionFormat || "1-on-1"} Session\n` +
        `• Level: ${db.skillLevel}\n` +
        `• Slot: ${db.timeSlot} on ${db.date}\n\n` +
        `Please confirm my session details! Thank you.`
      );
      window.open(`https://api.whatsapp.com/send?phone=917200747726&text=${waMessage}`, "_blank");
    } catch (e) {
      console.error("WhatsApp redirect failed", e);
    }
    
    return db;
  };

  const openCheckout = (planId: PlanId, cycle: BillingCycle) => setCheckout({ planId, cycle });

  const completeCheckout = (sub: Subscription, u: User) => {
    setSubscription(sub); setUser(u);
    setUsers((x) => (x.some((y) => y.email.toLowerCase() === u.email.toLowerCase()) ? x.map((y) => (y.email.toLowerCase() === u.email.toLowerCase() ? u : y)) : [...x, u]));
    setCheckout(null); navigate("billing");
  };

  const updateUser = (u: User) => { setUsers((x) => x.map((y) => (y.id === u.id ? u : y))); pushToast("success", "Profile saved."); };

  const page = useMemo(() => {
    if (route === "home") return <><Hero navigate={navigate} openCheckout={openCheckout} user={user} /><StatsStrip /><AboutSection /><FeaturesSection /><CoursesMarquee /><TestimonialsSection /><CTASection navigate={navigate} /></>;
    if (route === "about") return <AboutPage />;
    if (route === "features") return <FeaturesPage />;
    if (route === "pricing") return <PricingPage openCheckout={openCheckout} />;
    if (route === "faq") return <FAQPage />;
    if (route === "contact") return <ContactPage createEnquiry={createEnquiry} />;
    if (route === "demo") return <DemoPage createEnquiry={createEnquiry} createDemoBooking={createDemoBooking} />;
    if (route === "login") return <AuthPage users={users} setUsers={setUsers} setUser={setUser} pushToast={pushToast} setSubscription={setSubscription} />;
    if (route === "dashboard") return (
      <DashboardPage
        user={user}
        subscription={subscription}
        enquiries={enquiries}
        tickets={tickets}
        users={users}
        setUser={setUser}
        updateUser={updateUser}
        signOut={() => { setUser(null); setSubscription(null); pushToast("info", "Signed out."); }}
        assignments={assignments}
        setAssignments={setAssignments}
        practiceLogs={practiceLogs}
        setPracticeLogs={setPracticeLogs}
        setTickets={setTickets}
        setSubscription={setSubscription}
        setUsers={setUsers}
        pushToast={pushToast}
        demoBookings={demoBookings}
      />
    );
    if (route === "billing") return <BillingPage user={user} subscription={subscription} setSubscription={setSubscription} openCheckout={openCheckout} pushToast={pushToast} />;
    if (route === "support") return <SupportPage user={user} tickets={tickets} createTicket={createTicket} />;
    if (route === "awards") return <AwardsPage />;
    if (route === "gallery") return <GalleryPage />;
    if (route === "terms") return <LegalPage type="terms" />;
    return <LegalPage type="privacy" />;
  }, [route, user, subscription, enquiries, tickets, users, demoBookings]);

  return (
    <div className="min-h-screen">
      {route !== "home" && <Header route={route} user={user} navigate={navigate} />}
      {page}
      <Footer />
      <CheckoutModal request={checkout} currentUser={user} onClose={() => setCheckout(null)} onComplete={completeCheckout} pushToast={pushToast} />
      <Chatbot user={user} createTicket={createTicket} createEnquiry={createEnquiry} />
      <ToastList toasts={toasts} />
    </div>
  );
}
