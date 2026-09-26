import { useCallback, useEffect, useRef, useState } from "react";
import { backend } from "../api/backend";
import type {
  Cenario,
  Direcao,
  EntradaLog,
  FaseSimulacao,
  OpcoesSimulacao,
  ParametrosLabirinto,
  Quadro,
} from "../api/tipos";

export type Fase = "pronto" | FaseSimulacao;

const LIMITE_LOG = 400;

export function useSimulacao() {
  const [cenario, setCenario] = useState<Cenario | null>(null);
  const [quadro, setQuadro] = useState<Quadro | null>(null);
  const [log, setLog] = useState<EntradaLog[]>([]);
  const [simulacaoAtiva, setSimulacaoAtiva] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const idAtual = useRef<number | null>(null);
  const contadorId = useRef(0);

  useEffect(() => {
    backend.obterCenario().then(setCenario).catch(mostrarErro);

    const cancelar = backend.ouvirQuadros((novo) => {
      if (novo.id !== idAtual.current) return;
      setQuadro(novo);
      if (novo.log.length > 0) {
        setLog((anterior) => [...anterior, ...novo.log].slice(-LIMITE_LOG));
      }
    });
    return () => {
      cancelar.then((desinscrever) => desinscrever());
    };
  }, []);

  function mostrarErro(e: unknown) {
    setErro(typeof e === "string" ? e : String(e));
  }

  const limparSimulacao = useCallback(() => {
    idAtual.current = null;
    setSimulacaoAtiva(null);
    setQuadro(null);
    setLog([]);
  }, []);

  const executar = useCallback(async <T,>(acao: () => Promise<T>) => {
    setErro(null);
    try {
      return await acao();
    } catch (e) {
      mostrarErro(e);
      return undefined;
    }
  }, []);

  const trocarCenario = useCallback(
    async (acao: () => Promise<Cenario>) => {
      const novo = await executar(acao);
      if (novo) {
        limparSimulacao();
        setCenario(novo);
      }
    },
    [executar, limparSimulacao],
  );

  const gerarLabirinto = useCallback(
    (parametros: ParametrosLabirinto) =>
      trocarCenario(() => backend.gerarLabirinto(parametros)),
    [trocarCenario],
  );

  const sortearRatos = useCallback(
    (quantidade: number) => trocarCenario(() => backend.sortearRatos(quantidade)),
    [trocarCenario],
  );

  const alternarParede = useCallback(
    (x: number, y: number, direcao: Direcao) =>
      trocarCenario(() => backend.alternarParede(x, y, direcao)),
    [trocarCenario],
  );

  const iniciar = useCallback(
    async (opcoes: OpcoesSimulacao) => {
      contadorId.current += 1;
      const id = contadorId.current;
      idAtual.current = id;
      setQuadro(null);
      setLog([]);
      setSimulacaoAtiva(id);
      try {
        setErro(null);
        await backend.iniciarSimulacao(id, opcoes);
      } catch (e) {
        mostrarErro(e);
        limparSimulacao();
      }
    },
    [limparSimulacao],
  );

  const pausar = useCallback(() => executar(backend.pausarSimulacao), [executar]);
  const continuar = useCallback(() => executar(backend.continuarSimulacao), [executar]);
  const parar = useCallback(() => executar(backend.pararSimulacao), [executar]);

  const reiniciar = useCallback(async () => {
    await executar(backend.pararSimulacao);
    limparSimulacao();
  }, [executar, limparSimulacao]);

  const definirVelocidade = useCallback(
    (intervaloMs: number) => executar(() => backend.definirVelocidade(intervaloMs)),
    [executar],
  );

  const fase: Fase = quadro?.fase ?? (simulacaoAtiva !== null ? "rodando" : "pronto");

  return {
    cenario,
    quadro,
    log,
    fase,
    erro,
    limparErro: () => setErro(null),
    gerarLabirinto,
    sortearRatos,
    alternarParede,
    iniciar,
    pausar,
    continuar,
    parar,
    reiniciar,
    definirVelocidade,
  };
}
