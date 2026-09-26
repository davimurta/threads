import { useState } from "react";
import { Cabecalho } from "./componentes/Cabecalho/Cabecalho";
import { CanvasLabirinto } from "./componentes/Labirinto/CanvasLabirinto";
import { Legenda } from "./componentes/Labirinto/Legenda";
import { PainelControle } from "./componentes/PainelControle/PainelControle";
import { Placar } from "./componentes/Placar/Placar";
import { RegistroEventos } from "./componentes/RegistroEventos/RegistroEventos";
import { useSimulacao } from "./hooks/useSimulacao";
import "./App.css";

const STATUS_FINAIS = new Set(["chegou", "preso", "interrompido"]);

export default function App() {
  const sim = useSimulacao();
  const [modoEdicao, setModoEdicao] = useState(false);

  const emAndamento = sim.fase === "rodando" || sim.fase === "pausada";
  const editando = modoEdicao && !emAndamento;
  const threadsAtivas = sim.quadro
    ? sim.quadro.ratos.filter((r) => !STATUS_FINAIS.has(r.status)).length
    : 0;

  return (
    <div className="app">
      <Cabecalho
        fase={sim.fase}
        tempoMs={sim.quadro?.tempoMs ?? 0}
        threadsAtivas={threadsAtivas}
        vencedor={sim.quadro?.vencedor ?? null}
      />

      <main className="app__conteudo">
        <PainelControle
          fase={sim.fase}
          cenario={sim.cenario}
          modoEdicao={modoEdicao}
          aoMudarModoEdicao={setModoEdicao}
          aoGerar={sim.gerarLabirinto}
          aoSortearRatos={sim.sortearRatos}
          aoIniciar={(opcoes) => {
            setModoEdicao(false);
            sim.iniciar(opcoes);
          }}
          aoPausar={sim.pausar}
          aoContinuar={sim.continuar}
          aoParar={sim.parar}
          aoReiniciar={sim.reiniciar}
          aoMudarVelocidade={sim.definirVelocidade}
        />

        <section className="app__palco cartao">
          {sim.erro && (
            <div className="aviso aviso--erro" role="alert">
              <span>{sim.erro}</span>
              <button type="button" onClick={sim.limparErro} aria-label="Fechar aviso">
                ×
              </button>
            </div>
          )}
          {editando && !sim.erro && (
            <div className="aviso">
              Modo edição: clique perto de uma parede interna para abrir ou fechar. Áreas
              avermelhadas não têm caminho até o queijo.
            </div>
          )}
          {sim.cenario ? (
            <CanvasLabirinto
              cenario={sim.cenario}
              quadro={sim.quadro}
              modoEdicao={editando}
              aoAlternarParede={sim.alternarParede}
            />
          ) : (
            <div className="app__carregando">Carregando…</div>
          )}
          <Legenda mostrarInalcancaveis={sim.quadro === null} />
        </section>

        <aside className="app__lateral cartao">
          {sim.cenario && <Placar cenario={sim.cenario} quadro={sim.quadro} />}
          <RegistroEventos entradas={sim.log} />
        </aside>
      </main>
    </div>
  );
}
