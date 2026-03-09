import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, Building2, MapPin } from "lucide-react";

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Visit {
  id: string;
  corretor: string;
  equipe: string;
  cliente: string;
  data_visita: string;
  cidades: string;
  setores: string;
  valor_medio: number;
  latitude: number;
  longitude: number;
}

interface MapPageProps {
  onBack: () => void;
}

const MapPage = ({ onBack }: MapPageProps) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisits = async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("id, corretor, equipe, cliente, data_visita, cidades, setores, valor_medio, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setVisits(data as Visit[]);
      }
      setLoading(false);
    };

    fetchVisits();
  }, []);

  // Center on Goiânia by default, or first visit
  const center: [number, number] = visits.length > 0
    ? [visits[0].latitude, visits[0].longitude]
    : [-16.6869, -49.2648];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-hero sticky top-0 z-20">
        <div className="container max-w-lg flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <span className="font-heading font-bold text-primary-foreground text-sm">
              Mapa de Visitas
            </span>
          </div>
          <button
            onClick={onBack}
            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[60vh]">
            <p className="text-muted-foreground animate-pulse">Carregando mapa...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3">
            <MapPin className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              Nenhuma visita com localização registrada
            </p>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: "calc(100vh - 48px)", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visits.map((visit) => (
              <Marker
                key={visit.id}
                position={[visit.latitude, visit.longitude]}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{visit.cliente}</p>
                    <p>Corretor: {visit.corretor}</p>
                    <p>Equipe: {visit.equipe}</p>
                    <p>Data: {new Date(visit.data_visita + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                    <p>Cidade: {visit.cidades}</p>
                    <p>Setor: {visit.setores}</p>
                    <p>Valor: R$ {Number(visit.valor_medio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Stats overlay */}
        {!loading && visits.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-card/95 backdrop-blur-sm rounded-xl shadow-elevated p-3">
            <div className="flex items-center justify-around text-center">
              <div>
                <p className="text-lg font-heading font-bold text-foreground">{visits.length}</p>
                <p className="text-xs text-muted-foreground">Visitas</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-lg font-heading font-bold text-foreground">
                  {[...new Set(visits.map((v) => v.cidades))].length}
                </p>
                <p className="text-xs text-muted-foreground">Cidades</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-lg font-heading font-bold text-foreground">
                  {[...new Set(visits.map((v) => v.corretor))].length}
                </p>
                <p className="text-xs text-muted-foreground">Corretores</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
