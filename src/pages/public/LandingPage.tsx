import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import {
  Building2,
  Kanban,
  CalendarCheck2,
  Wallet,
  ArrowRight,
  Check,
  Lock,
  Hexagon,
  Triangle,
  Circle,
  Square,
  Octagon,
  ChevronDown,
  AlertTriangle,
  XCircle,
  TrendingDown,
  LayoutDashboard,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const plans = [
  {
    name: "Free Trial",
    priceMensal: "Grátis",
    priceAnual: "Grátis",
    period: "por 7 dias",
    description: "Ideal para testar o potencial do Engify na sua obra.",
    features: [
      "Até 2 obras ativas",
      "Até 3 membros na equipe",
      "Kanban e Diário de obra",
      "Financeiro básico",
      "500MB de armazenamento",
    ],
    cta: "Começar grátis",
    href: "/register/team",
    highlight: false,
    active: true,
  },
  {
    name: "Canteiro",
    priceMensal: "R$ 147",
    priceAnual: "R$ 117",
    period: "/mês",
    description: "Para pequenas construtoras e empreiteiros.",
    features: [
      "Até 5 obras simultâneas",
      "Até 10 membros na equipe",
      "Kanban completo",
      "Controle de diárias e ponto",
      "Financeiro (DRE e Fluxo)",
      "5GB de armazenamento",
    ],
    cta: "Assinar Agora",
    href: "#",
    highlight: true,
    active: true,
  },
  {
    name: "Engenharia",
    priceMensal: "R$ 397",
    priceAnual: "R$ 317",
    period: "/mês",
    description: "A solução completa para empresas em crescimento.",
    features: [
      "Obras ilimitadas",
      "Membros ilimitados",
      "Módulo de RH & Documentos",
      "Geofencing (Ponto via GPS)",
      "Módulo Financeiro Avançado",
      "50GB de armazenamento",
      "Relatórios customizados",
    ],
    cta: "Falar com Consultor",
    href: "#",
    highlight: false,
    active: false,
  },
  {
    name: "Corporativo",
    priceMensal: "R$ 997",
    priceAnual: "R$ 797",
    period: "/mês",
    description: "Poder total para grandes operações e holdings.",
    features: [
      "Tudo do plano Engenharia",
      "Multi-empresa (Holding)",
      "API de Integração",
      "Suporte VIP 24/7",
      "Onboarding assistido",
      "Armazenamento ilimitado",
      "SLA de 99.9%",
    ],
    cta: "Consultar Enterprise",
    href: "#",
    highlight: false,
    active: false,
  },
];

const faqs = [
  {
    q: "O que acontece após os 7 dias grátis?",
    a: "Sua conta entra em modo de leitura. Você não perde seus dados, mas não poderá adicionar novas informações ou criar novas obras até escolher um plano que se adeque à sua necessidade.",
  },
  {
    q: "O que é o Geofencing no plano Engenharia?",
    a: "É uma cerca virtual por GPS. Com ela, sua equipe só consegue registrar o ponto se estiver realmente dentro do canteiro de obras, garantindo total controle sobre a presença real no campo.",
  },
  {
    q: "Como funciona o limite de obras simultâneas?",
    a: "Contamos apenas obras com status 'Em Andamento' ou 'Planejamento'. Obras finalizadas ou canceladas ficam arquivadas para sua consulta e não consomem o limite do seu plano.",
  },
  {
    q: "Posso fazer upgrade de plano a qualquer momento?",
    a: "Sim! Você pode mudar de plano direto pelo painel administrativo. O valor será recalculado proporcionalmente aos dias restantes do seu ciclo de cobrança atual.",
  },
];

const fadeUp: HTMLMotionProps<"div"> = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" },
};

export function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Navbar */}
        <nav className="fixed top-0 w-full z-50 border-b bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Engify</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/register/team">Começar grátis</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="container pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
              <Badge variant="secondary" className="text-sm px-4 py-1.5 border-primary/20 bg-primary/10 text-primary">
                Novo - Trial gratuito por 7 dias
              </Badge>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Gestão de obras <span className="text-primary block">sem complicação</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Centralize o cronograma, controle de diárias e o financeiro. Economize horas de retrabalho e evite prejuízos na sua construtora.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8" asChild>
                    <Link to="/register/team">
                      Começar grátis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <span className="text-xs text-muted-foreground ml-1">✓ Sem necessidade de cartão de crédito</span>
                </div>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8" asChild>
                  <Link to="/login">Ver demonstração</Link>
                </Button>
              </div>
            </motion.div>

            {/* Hero Mockup - Improved Premium Dashboard Illustration */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent blur-3xl rounded-full" />
              <div className="relative rounded-2xl border bg-card/40 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden border-border/50 ring-1 ring-white/10">
                {/* Window Controls */}
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/20">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80 shadow-sm" />
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <div className="h-2 w-20 bg-muted rounded-full" />
                  </div>
                </div>

                <div className="flex">
                  {/* Mock Sidebar */}
                  <div className="w-16 border-r border-border/50 bg-muted/10 p-3 hidden sm:flex flex-col gap-4">
                    {[LayoutDashboard, Building2, Kanban, CalendarCheck2, Wallet, Smartphone].map((Icon, i) => (
                      <div key={i} className={`h-10 w-10 rounded-xl flex items-center justify-center ${i === 0 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground/60 hover:bg-muted"}`}>
                        <Icon size={20} />
                      </div>
                    ))}
                  </div>

                  {/* Mock Content */}
                  <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-transparent to-muted/5">
                    {/* Header Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border bg-background/50 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Obras Ativas</span>
                          <Badge variant="outline" className="text-[10px] h-4 px-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold">+2</Badge>
                        </div>
                        <div className="text-2xl font-bold">12</div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-[70%]" />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border bg-background/50 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Financeiro Geral</span>
                          <TrendingDown className="h-3 w-3 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold">R$ 84k</div>
                        <div className="text-[10px] text-emerald-500 font-medium">Margem de 18%</div>
                      </div>
                    </div>

                    {/* Active Project List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Projetos em Destaque</span>
                        <div className="h-1 w-8 bg-muted rounded-full" />
                      </div>
                      {[
                        { name: "Edifício Aurora", progress: 65, status: "No Prazo", color: "bg-blue-500" },
                        { name: "Residencial Jardins", progress: 32, status: "Atraso Leve", color: "bg-amber-500" },
                        { name: "Galpão Logístico", progress: 88, status: "Finalizando", color: "bg-emerald-500" },
                      ].map((proj, i) => (
                        <div key={i} className="group flex items-center justify-between p-3 rounded-xl border bg-background/80 hover:bg-muted/30 transition-colors shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg ${proj.color}/10 flex items-center justify-center text-xs font-bold ${proj.color.replace('bg-', 'text-')}`}>
                              {proj.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{proj.name}</div>
                              <div className="text-[10px] text-muted-foreground">{proj.progress}% Concluído</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-muted/50 border-transparent">{proj.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y bg-muted/30 py-10">
          <div className="container">
            <p className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
              Confiado por construtoras inovadoras
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale-[50%]">
              <div className="flex items-center gap-2"><Hexagon className="h-6 w-6"/> <span className="font-bold text-lg">BuildCorp</span></div>
              <div className="flex items-center gap-2"><Triangle className="h-6 w-6"/> <span className="font-bold text-lg">Vertex Eng</span></div>
              <div className="flex items-center gap-2"><Octagon className="h-6 w-6"/> <span className="font-bold text-lg">Solid Base</span></div>
              <div className="flex items-center gap-2"><Circle className="h-6 w-6"/> <span className="font-bold text-lg">Vanguard</span></div>
              <div className="flex items-center gap-2"><Square className="h-6 w-6"/> <span className="font-bold text-lg">Structra</span></div>
            </div>
          </div>
        </section>

        {/* Problem Agitation Solution (PAS) */}
        <section className="container py-24">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl mb-4">Ainda gerenciando obras no caos das planilhas?</h2>
            <p className="text-xl text-muted-foreground">
              Desvios de orçamento, falta de previsibilidade e perda de informações não precisam ser o padrão do seu dia a dia.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: AlertTriangle, title: "Informação descentralizada", desc: "Arquivos perdidos no WhatsApp e falhas de comunicação entre escritório e canteiro." },
              { icon: XCircle, title: "Pagamentos duplicados", desc: "Controle de diárias feito no papel gera confusão nas sextas-feiras de pagamento." },
              { icon: TrendingDown, title: "Falta de visão do cronograma", desc: "Atrasos em tarefas críticas que só são descobertos quando já causaram prejuízo." },
            ].map((problem, i) => (
              <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                <Card className="bg-destructive/5 border-destructive/20 h-full">
                  <CardHeader>
                    <problem.icon className="h-8 w-8 text-destructive mb-3" />
                    <CardTitle className="text-lg">{problem.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{problem.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features - Z-Pattern */}
        <section className="py-24 bg-muted/10 overflow-hidden">
          <div className="container space-y-32">
            {/* Feature 1: Kanban (Text Left, Image Right) */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp} className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Kanban className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-3xl font-bold">Domine o cronograma com Kanban</h3>
                <p className="text-lg text-muted-foreground">
                  Transforme o planejamento da obra em um quadro visual e interativo. Saiba exatamente o que está sendo feito, o que está travado e o que já foi concluído.
                </p>
                <ul className="space-y-3">
                  {["Acompanhe o status em tempo real", "Anexe arquivos e fotos por tarefa", "Atribua responsáveis com facilidade"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/20 p-1"><Check className="h-4 w-4 text-primary" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
                <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-3xl -z-10" />
                <div className="bg-card border rounded-2xl p-6 shadow-xl space-y-4">
                  {/* Fake Kanban layout */}
                  <div className="grid grid-cols-3 gap-4">
                    {["A Fazer", "Fazendo", "Concluído"].map((col, i) => (
                      <div key={i} className="bg-muted rounded-lg p-3 space-y-3">
                        <div className="text-xs font-semibold uppercase">{col}</div>
                        <div className="h-20 bg-background rounded border shadow-sm p-3">
                          <div className="h-3 w-3/4 bg-muted rounded mb-2" />
                          <div className="h-2 w-1/2 bg-muted rounded" />
                        </div>
                        {i !== 2 && (
                          <div className="h-20 bg-background rounded border shadow-sm p-3 opacity-60">
                            <div className="h-3 w-full bg-muted rounded mb-2" />
                            <div className="h-2 w-1/3 bg-muted rounded" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature 2: Diárias (Image Left, Text Right) */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1 relative flex justify-center">
                <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-3xl -z-10 w-3/4" />
                <div className="bg-card w-[280px] border-[6px] border-muted rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden flex flex-col h-[500px]">
                  {/* Fake notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-muted rounded-b-xl" />
                  <div className="mt-6 flex-1 space-y-4">
                    <div className="flex items-center gap-3 border-b pb-3">
                      <Smartphone className="text-emerald-500" />
                      <span className="font-semibold text-sm">Registro de Ponto</span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">João Silva (Pedreiro)</div>
                        <div className="text-sm font-semibold">1 Diária registrada</div>
                      </div>
                      <Check className="text-emerald-500 h-5 w-5" />
                    </div>
                    <div className="space-y-2 pt-4">
                      <div className="h-10 bg-muted rounded-lg w-full" />
                      <div className="h-10 bg-muted rounded-lg w-full" />
                      <div className="h-10 bg-muted rounded-lg w-full opacity-50" />
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="h-12 bg-emerald-500 rounded-lg w-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">Gerar Pagamentos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div {...fadeUp} className="order-1 lg:order-2 space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CalendarCheck2 className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-bold">Resolução do caos das diárias</h3>
                <p className="text-lg text-muted-foreground">
                  Dê o poder nas mãos dos encarregados para apontar presentes direto da obra via celular. Elimine o retrabalho e centralize os pagamentos de sexta-feira.
                </p>
                <ul className="space-y-3">
                  {["Aponte presentes pelo celular", "Gerencie o valor das diárias", "Consolidação de pagamentos com 1 clique"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-500/20 p-1"><Check className="h-4 w-4 text-emerald-500" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Feature 3: Financeiro (Text Left, Image Right) */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp} className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Wallet className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-3xl font-bold">Saúde financeira no azul</h3>
                <p className="text-lg text-muted-foreground">
                  Visão clara do fluxo de caixa de cada projeto. Despesas com fornecedores, recebimentos de clientes e custo de equipe em um painel simples e objetivo.
                </p>
                <ul className="space-y-3">
                  {["Fluxo de caixa detalhado por obra", "Gestão de fornecedores e recibos", "Exportação amigável para contabilidade"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-500/20 p-1"><Check className="h-4 w-4 text-blue-500" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
                <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-3xl -z-10" />
                <div className="bg-card border rounded-2xl p-0 shadow-2xl overflow-hidden ring-1 ring-white/10">
                  <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-bold uppercase tracking-wider">Fluxo de Caixa</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">OBRA #2024-08</Badge>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Entradas</span>
                        <div className="text-xl font-black text-emerald-500">R$ 124.500</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Saídas</span>
                        <div className="text-xl font-black text-destructive">R$ 92.140</div>
                      </div>
                    </div>
                    
                    {/* Visual Chart Mockup */}
                    <div className="h-32 flex items-end justify-between gap-1 border-b border-border/50 pb-2">
                      {[40, 60, 45, 90, 65, 80, 55, 70, 85, 40, 50, 75].map((h, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          className={`w-full rounded-t-sm ${i > 8 ? "bg-primary/20" : "bg-primary/60"}`} 
                        />
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground uppercase">
                      <span>Jan</span>
                      <span>Jun</span>
                      <span>Dez</span>
                    </div>

                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-primary rotate-180" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Saldo Projetado</div>
                          <div className="text-[10px] text-muted-foreground">Previsão para 30 dias</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">+ R$ 32.360</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Feature 4: RH & Geofencing (Image Left, Text Right) */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1 relative">
                <div className="absolute -inset-4 bg-orange-500/10 blur-3xl rounded-3xl -z-10" />
                <div className="bg-card border rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-6">
                    <Smartphone className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold">Cerca Virtual (Geofencing)</span>
                  </div>
                  <div className="relative h-48 bg-muted rounded-xl mb-4 overflow-hidden">
                    {/* Fake Map Illustration */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-10 left-10 w-32 h-1 bg-muted-foreground/50 rotate-45" />
                      <div className="absolute top-20 left-40 w-48 h-1 bg-muted-foreground/50 -rotate-12" />
                      <div className="absolute top-5 left-80 w-1 h-40 bg-muted-foreground/50" />
                    </div>
                    {/* Target Radius */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-orange-500/10 border-2 border-dashed border-orange-500/30 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
                      <div className="absolute w-3 h-3 rounded-full bg-orange-500" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 p-3 bg-background/90 backdrop-blur rounded-lg shadow-lg border border-orange-500/20">
                      <div className="text-[10px] font-bold uppercase text-orange-500 mb-1">Localização Verificada</div>
                      <div className="text-xs font-medium">Obra: Residencial Aurora</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Ricardo Alves", time: "07:02", status: "Dentro" },
                      { name: "Marcos Paulo", time: "07:15", status: "Dentro" }
                    ].map((user, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-background border border-border/50">
                        <div className="text-xs font-medium">{user.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{user.time}</span>
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
              <motion.div {...fadeUp} className="order-1 lg:order-2 space-y-6">
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">NOVIDADE</Badge>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                  <Smartphone className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-3xl font-bold">Gestão de RH & Geofencing</h3>
                <p className="text-lg text-muted-foreground">
                  Acompanhe sua equipe de perto. O Engify utiliza geolocalização para garantir que o registro de ponto seja feito apenas dentro do canteiro.
                </p>
                <ul className="space-y-3">
                  {["Cerca virtual por GPS para registro de ponto", "Histórico de documentos e EPIs por funcionário", "Cálculo automatizado de encargos e diárias"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="rounded-full bg-orange-500/20 p-1"><Check className="h-4 w-4 text-orange-500" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="container py-24">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold">Investimento simples, sem surpresas</h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho da sua construtora. Explore tudo sem compromisso por 7 dias.
            </p>

            <div className="mt-8 inline-flex items-center justify-center p-1 bg-muted rounded-full">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isAnnual ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Anual <span className="ml-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className={`relative h-full flex flex-col ${plan.highlight ? "border-primary shadow-xl ring-2 ring-primary scale-105 z-10" : "border-border/50"}`}>
                  {plan.highlight && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-black tracking-widest py-1 px-4 shadow-lg">
                        Plano Recomendado
                      </Badge>
                    </div>
                  )}
                  <CardHeader className={`${plan.highlight ? "pt-8" : ""}`}>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">{isAnnual ? plan.priceAnual : plan.priceMensal}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <CardDescription className="mt-2 text-sm">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-3 text-sm">
                          <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                          <span className="text-muted-foreground">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {plan.active ? (
                      <Button className={`w-full ${plan.highlight ? "h-12 text-base" : ""}`} variant={plan.highlight ? "default" : "outline"} asChild>
                        <Link to={plan.href}>{plan.cta}</Link>
                      </Button>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button className="w-full" variant="secondary" disabled>
                              <Lock className="mr-2 h-4 w-4" />
                              {plan.cta}
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Disponível em breve. Aproveite o trial gratuito!
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ - Accordion */}
        <section className="bg-muted/30 py-24 border-y border-border/50">
          <div className="container max-w-3xl">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="text-3xl font-bold">Perguntas Frequentes</h2>
              <p className="mt-3 text-muted-foreground">
                Tire suas dúvidas e veja como o Engify se adapta a você.
              </p>
            </motion.div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.1 }}
                  className="border rounded-lg bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between font-medium text-left hover:bg-muted/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-4 pt-1 text-muted-foreground text-sm leading-relaxed border-t mt-2">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="container py-24 text-center">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto space-y-8 bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Simplifique sua próxima obra hoje.</h2>
            <p className="text-lg text-muted-foreground">
              Junte-se a dezenas de construtoras que já abandonaram as planilhas e assumiram o controle das suas margens de lucro.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-base" asChild>
                <Link to="/register/team">
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t">
          <div className="container flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Engify © 2026</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="#" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Privacidade</Link>
              <Link to="#" className="hover:text-foreground transition-colors">Contato</Link>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
