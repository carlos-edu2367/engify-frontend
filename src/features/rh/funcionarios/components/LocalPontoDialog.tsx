import { useEffect, useState } from "react";
import { MapPin, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MapPicker } from "@/components/features/rh/MapPicker";
import type { RhLocalPonto, RhLocalPontoCreateRequest } from "@/types/rh.types";

type LocalPontoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  local?: RhLocalPonto | null;
  loading?: boolean;
  onSubmit: (data: RhLocalPontoCreateRequest) => void;
};

const GOIANIA = { latitude: -16.6869, longitude: -49.2648 };

export function LocalPontoDialog({ open, onOpenChange, local, loading, onSubmit }: LocalPontoDialogProps) {
  const [nome, setNome] = useState("");
  const [latitude, setLatitude] = useState(GOIANIA.latitude);
  const [longitude, setLongitude] = useState(GOIANIA.longitude);
  const [raio, setRaio] = useState(100);

  useEffect(() => {
    if (!open) return;
    setNome(local?.nome ?? "");
    setLatitude(local?.latitude ?? GOIANIA.latitude);
    setLongitude(local?.longitude ?? GOIANIA.longitude);
    setRaio(local?.raio_metros ?? 100);
  }, [local, open]);

  const submit = () => {
    if (!nome.trim()) return;
    onSubmit({
      nome: nome.trim(),
      latitude,
      longitude,
      raio_metros: Math.min(1000, Math.max(20, Math.round(raio))),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{local ? "Editar local permitido" : "Novo local permitido"}</DialogTitle>
          <DialogDescription>
            Defina o ponto central e o raio aceito para registros de ponto deste colaborador.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Nome do local</span>
            <Input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Escritorio Goiania" />
          </label>
          <div className="rounded-md border p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4" />
              Localizacao
            </div>
            {open ? <MapPicker lat={latitude} lng={longitude} radius={raio} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} /> : null}
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Raio permitido: {raio} metros</span>
            <Input
              type="range"
              min={20}
              max={1000}
              step={10}
              value={raio}
              onChange={(event) => setRaio(Number(event.target.value))}
            />
            <Input
              type="number"
              min={20}
              max={1000}
              value={raio}
              onChange={(event) => setRaio(Number(event.target.value))}
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={loading || !nome.trim()}>
            <Save className="size-4" />
            {loading ? "Salvando..." : "Salvar local"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
