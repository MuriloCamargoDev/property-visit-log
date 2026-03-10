import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  CalendarDays,
  DollarSign,
  Trophy,
  Target,
  BarChart3,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardPageProps {
  onBack: () => void;
}

interface Visit {
  id: string;
  corretor: string;
  equipe: string;
  data_visita: string;
  valor_medio: number;
  mes: string;
  ano: string;
  cidades: string;
  cliente: string;
}

const CHART_COLORS = [
  "hsl(220, 60%, 20%)",
  "hsl(42, 85%, 55%)",
  "hsl(152, 60%, 40%)",
  "hsl(220, 50%, 45%)",
  "hsl(42, 70%, 40%)",
  "hsl(0, 84%, 60%)",
  "hsl(220, 30%, 60%)",
  "hsl(152, 40%, 55%)",
];

const RANK_ICONS = [Crown, Medal, Award];

const DashboardPage = ({ onBack }: DashboardPageProps) => {
  const { profile } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = String(now.getFullYear());

  useEffect(() => {
    const fetchVisits = async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("id, corretor, equipe, data_visita, valor_medio, mes, ano, cidades, cliente")
        .order("data_visita", { ascending: false });

      if (!error && data) setVisits(data);
      setLoading(false);
    };
    fetchVisits();
  }, []);

  const stats = useMemo(() => {
    const today = now.toISOString().split("T")[0];
    const todayVisits = visits.filter((v) => v.data_visita === today);
    const monthVisits = visits.filter(
      (v) => v.mes === currentMonth && v.ano === currentYear
    );
    const totalValue = monthVisits.reduce((s, v) => s + Number(v.valor_medio), 0);
    const activeCorretores = new Set(monthVisits.map((v) => v.corretor)).size;

    return { todayVisits: todayVisits.length, monthVisits: monthVisits.length, totalValue, activeCorretores };
  }, [visits, currentMonth, currentYear]);

  const corretorRanking = useMemo(() => {
    const monthVisits = visits.filter(
      (v) => v.mes === currentMonth && v.ano === currentYear
    );
    const map = new Map<string, { count: number; value: number; equipe: string }>();
    monthVisits.forEach((v) => {
      const cur = map.get(v.corretor) || { count: 0, value: 0, equipe: v.equipe };
      cur.count++;
      cur.value += Number(v.valor_medio);
      map.set(v.corretor, cur);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.count - a.count);
  }, [visits, currentMonth, currentYear]);

  const equipeRanking = useMemo(() => {
    const monthVisits = visits.filter(
      (v) => v.mes === currentMonth && v.ano === currentYear
    );
    const map = new Map<string, { count: number; value: number; corretores: Set<string> }>();
    monthVisits.forEach((v) => {
      const cur = map.get(v.equipe) || { count: 0, value: 0, corretores: new Set<string>() };
      cur.count++;
      cur.value += Number(v.valor_medio);
      cur.corretores.add(v.corretor);
      map.set(v.equipe, cur);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, count: d.count, value: d.value, corretores: d.corretores.size }))
      .sort((a, b) => b.count - a.count);
  }, [visits, currentMonth, currentYear]);

  const chartData = useMemo(() => {
    return equipeRanking.map((e) => ({ name: e.name, visitas: e.count, valor: e.value / 100 }));
  }, [equipeRanking]);

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse font-heading">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-primary/80 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-heading text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Dashboard
            </h1>
            <p className="text-xs opacity-80">Ranking e indicadores • {currentMonth}/{currentYear}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-5 pb-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15">
                <CalendarDays className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Visitas Hoje</p>
                <p className="text-2xl font-heading font-bold text-foreground">{stats.todayVisits}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15">
                <Target className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Visitas no Mês</p>
                <p className="text-2xl font-heading font-bold text-foreground">{stats.monthVisits}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15">
                <DollarSign className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Potencial</p>
                <p className="text-lg font-heading font-bold text-foreground">{formatCurrency(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Corretores Ativos</p>
                <p className="text-2xl font-heading font-bold text-foreground">{stats.activeCorretores}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Rankings */}
        <Tabs defaultValue="corretores" className="space-y-3">
          <TabsList className="w-full grid grid-cols-2 bg-muted">
            <TabsTrigger value="corretores" className="font-heading text-sm">
              <Trophy className="w-4 h-4 mr-1.5" /> Corretores
            </TabsTrigger>
            <TabsTrigger value="equipes" className="font-heading text-sm">
              <Users className="w-4 h-4 mr-1.5" /> Equipes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="corretores" className="space-y-4">
            {/* Top 3 Podium */}
            {corretorRanking.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {corretorRanking.slice(0, 3).map((c, i) => {
                  const RankIcon = RANK_ICONS[i];
                  const colors = [
                    "from-accent/20 to-accent/5 border-accent/30",
                    "from-muted to-muted/50 border-border",
                    "from-muted to-muted/50 border-border",
                  ];
                  return (
                    <Card key={c.name} className={`border bg-gradient-to-b ${colors[i]} overflow-hidden`}>
                      <CardContent className="p-3 text-center space-y-1">
                        <RankIcon className={`w-6 h-6 mx-auto ${i === 0 ? "text-accent-foreground" : "text-muted-foreground"}`} />
                        <p className="text-xs font-heading font-bold truncate text-foreground">{c.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{c.equipe}</Badge>
                        <p className="text-lg font-heading font-bold text-foreground">{c.count}</p>
                        <p className="text-[10px] text-muted-foreground">visitas</p>
                        <p className="text-[10px] font-medium text-muted-foreground">{formatCurrency(c.value)}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Full Ranking Table */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-foreground" />
                  Ranking Mensal de Corretores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>Corretor</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead className="text-center">Visitas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corretorRanking.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma visita registrada este mês
                        </TableCell>
                      </TableRow>
                    ) : (
                      corretorRanking.map((c, i) => (
                        <TableRow key={c.name}>
                          <TableCell className="text-center font-heading font-bold text-muted-foreground">
                            {i + 1}º
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{c.equipe}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-heading font-bold text-foreground">{c.count}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(c.value)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipes" className="space-y-4">
            {/* Team Chart */}
            {chartData.length > 0 && (
              <Card className="border-none shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading">Visitas por Equipe</CardTitle>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(0, 0%, 100%)",
                          border: "1px solid hsl(220, 15%, 88%)",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="visitas" fill="hsl(220, 60%, 20%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Team Table */}
            <Card className="border-none shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent-foreground" />
                  Ranking de Equipes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead className="text-center">Corretores</TableHead>
                      <TableHead className="text-center">Visitas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipeRanking.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma visita registrada este mês
                        </TableCell>
                      </TableRow>
                    ) : (
                      equipeRanking.map((e, i) => (
                        <TableRow key={e.name}>
                          <TableCell className="text-center font-heading font-bold text-muted-foreground">
                            {i + 1}º
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{e.name}</TableCell>
                          <TableCell className="text-center text-foreground">{e.corretores}</TableCell>
                          <TableCell className="text-center font-heading font-bold text-foreground">{e.count}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(e.value)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashboardPage;
