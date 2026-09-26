import { useEffect, useState } from "react";
import type { Cenario, OpcoesSimulacao, ParametrosLabirinto } from "../../api/tipos";
import type { Fase } from "../../hooks/useSimulacao";
import { Alternador } from "../comuns/Alternador";
import { Botao } from "../comuns/Botao";
import { CampoSlider } from "../comuns/CampoSlider";
import "./PainelControle.css";

interface Props {
  fase: Fase;
  cenario: Cenario | null;
  modoEdicao: boolean;
  aoMudarModoEdicao: (ligado: boolean) => void;
  aoGerar: (parametros: ParametrosLabirinto) => void;
  aoSortearRatos: (quantidade: number) => void;
  aoIniciar: (opcoes: OpcoesSimulacao) => void;
  aoPausar: () => void;
  aoContinuar: () => void;
  aoParar: () => void;
  aoReiniciar: () => void;
  aoMudarVelocidade: (intervaloMs: number) => void;
}

export function PainelControle(props: Props) {
  const { fase, cenario, modoEdicao } = props;

  const [largura, setLargura] = useState(15);
  const [altura, setAltura] = useState(15);
  const [ciclos, setCiclos] = useState(8);
  const [semente, setSemente] = useState("");
  const [quantidadeRatos, setQuantidadeRatos] = useState(4);
  const [intervaloMs, setIntervaloMs] = useState(120);
  const [pararNoPrimeiro, setPararNoPrimeiro] = useState(true);

  const [sincronizado, setSincronizado] = useState(false);
  useEffect(() => {
    if (cenario && !sincronizado) {
      setLargura(cenario.largura);
      setAltura(cenario.altura);
      setQuantidadeRatos(cenario.ratos.length);
      setSincronizado(true);
    }
  }, [cenario, sincronizado]);

  const emAndamento = fase === "rodando" || fase === "pausada";
  const bloqueado = emAndamento || !cenario;

  function gerar() {
    const numero = semente.trim() === "" ? null : Number(semente);
    props.aoGerar({
      largura,
      altura,
      quantidadeRatos,
      ciclos,
      semente: numero !== null && Number.isFinite(numero) ? Math.abs(Math.floor(numero)) : null,
    });
  }

  function mudarQuantidadeRatos(valor: number) {
    setQuantidadeRatos(valor);
    props.aoSortearRatos(valor);
  }

  function mudarVelocidade(valor: number) {
    setIntervaloMs(valor);
    if (emAndamento) props.aoMudarVelocidade(valor);
  }

  return (
    <aside className="painel-controle cartao">
      <section className="painel-controle__secao">
        <h2 className="titulo-secao">Labirinto</h2>
        <CampoSlider rotulo="Colunas" valor={largura} min={5} max={40} desabilitado={bloqueado} aoMudar={setLargura} />
        <CampoSlider rotulo="Linhas" valor={altura} min={5} max={40} desabilitado={bloqueado} aoMudar={setAltura} />
        <CampoSlider
          rotulo="Caminhos extras"
          valor={ciclos}
          min={0}
          max={40}
          sufixo="%"
          desabilitado={bloqueado}
          aoMudar={setCiclos}
        />
        <label className="campo-texto">
          <span>Semente</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder={cenario ? `atual: ${cenario.semente}` : "aleatória"}
            value={semente}
            disabled={bloqueado}
            onChange={(e) => setSemente(e.target.value.replace(/\D/g, "").slice(0, 9))}
          />
        </label>
        <Botao variante="primario" disabled={bloqueado} onClick={gerar}>
          Gerar labirinto
        </Botao>
      </section>

      <section className="painel-controle__secao">
        <h2 className="titulo-secao">Ratos</h2>
        <CampoSlider
          rotulo="Quantidade"
          valor={quantidadeRatos}
          min={1}
          max={12}
          desabilitado={bloqueado}
          aoMudar={mudarQuantidadeRatos}
        />
        <Botao disabled={bloqueado} onClick={() => props.aoSortearRatos(quantidadeRatos)}>
          Sortear posições
        </Botao>
        <Alternador
          rotulo="Editar paredes"
          descricao="Clique entre duas células para abrir ou fechar a parede"
          ligado={modoEdicao && !emAndamento}
          desabilitado={bloqueado}
          aoMudar={props.aoMudarModoEdicao}
        />
      </section>

      <section className="painel-controle__secao">
        <h2 className="titulo-secao">Simulação</h2>
        <CampoSlider
          rotulo="Intervalo por passo"
          valor={intervaloMs}
          min={10}
          max={500}
          passo={10}
          sufixo=" ms"
          aoMudar={mudarVelocidade}
        />
        <Alternador
          rotulo="Parar no primeiro"
          descricao="Encerra todas as threads quando um rato achar o queijo"
          ligado={pararNoPrimeiro}
          desabilitado={emAndamento}
          aoMudar={setPararNoPrimeiro}
        />

        <div className="painel-controle__acoes">
          {!emAndamento && (
            <Botao
              variante="primario"
              disabled={!cenario}
              onClick={() => props.aoIniciar({ intervaloMs, pararNoPrimeiro })}
            >
              {fase === "finalizada" ? "Rodar de novo" : "Iniciar"}
            </Botao>
          )}
          {fase === "rodando" && <Botao onClick={props.aoPausar}>Pausar</Botao>}
          {fase === "pausada" && (
            <Botao variante="primario" onClick={props.aoContinuar}>
              Continuar
            </Botao>
          )}
          {emAndamento && (
            <Botao variante="perigo" onClick={props.aoParar}>
              Parar
            </Botao>
          )}
          {fase === "finalizada" && <Botao onClick={props.aoReiniciar}>Limpar</Botao>}
        </div>
      </section>
    </aside>
  );
}
