import type { Fase } from "../../hooks/useSimulacao";
import { corDoRato, formatarTempo } from "../../util/ratos";
import "./Cabecalho.css";

const ROTULO_FASE: Record<Fase, string> = {
  pronto: "Pronto",
  rodando: "Rodando",
  pausada: "Pausada",
  finalizada: "Finalizada",
};

interface Props {
  fase: Fase;
  tempoMs: number;
  threadsAtivas: number;
  vencedor: number | null;
}

export function Cabecalho({ fase, tempoMs, threadsAtivas, vencedor }: Props) {
  return (
    <header className="cabecalho">
      <div className="cabecalho__marca">
        <h1>Labirinto dos Ratos</h1>
        <span>Cada rato é uma thread independente buscando o queijo</span>
      </div>

      <div className="cabecalho__status">
        {vencedor !== null && (
          <span className="cabecalho__vencedor">
            <span className="ponto" style={{ background: corDoRato(vencedor) }} />
            Rato {vencedor} encontrou o queijo
          </span>
        )}
        <Indicador rotulo="Threads ativas" valor={String(threadsAtivas)} />
        <Indicador rotulo="Tempo" valor={formatarTempo(tempoMs)} />
        <span className={`selo selo--${fase}`}>{ROTULO_FASE[fase]}</span>
      </div>
    </header>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <span className="indicador">
      <span className="indicador__rotulo">{rotulo}</span>
      <span className="indicador__valor">{valor}</span>
    </span>
  );
}
