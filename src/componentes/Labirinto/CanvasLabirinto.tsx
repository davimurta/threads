import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Cenario, Direcao, Posicao, Quadro, VisaoRato } from "../../api/tipos";
import { AnimadorRatos } from "./animacao";
import {
  calcularGeometria,
  desenharCena,
  desenharParedes,
  lerTema,
  paredeSobCursor,
  type ParedeAlvo,
  type Tema,
} from "./desenho";
import "./Labirinto.css";

interface Props {
  cenario: Cenario;
  quadro: Quadro | null;
  modoEdicao: boolean;
  aoAlternarParede: (x: number, y: number, direcao: Direcao) => void;
}

interface RatoAtual {
  id: number;
  posicao: Posicao;
  visao?: VisaoRato;
  semCaminho?: boolean;
}

export function CanvasLabirinto({ cenario, quadro, modoEdicao, aoAlternarParede }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 });
  const [paredeRealcada, setParedeRealcada] = useState<ParedeAlvo | null>(null);
  const [versaoTema, setVersaoTema] = useState(0);

  const animador = useRef(new AnimadorRatos());
  const camadaParedes = useRef<HTMLCanvasElement | null>(null);
  const tema = useRef<Tema | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observador = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      setTamanho({ largura: Math.floor(width), altura: Math.floor(height) });
    });
    observador.observe(container);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const consulta = matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = () => setVersaoTema((v) => v + 1);
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, []);

  useEffect(() => {
    if (!modoEdicao) setParedeRealcada(null);
  }, [modoEdicao]);

  const geometria = useMemo(
    () => calcularGeometria(cenario, tamanho.largura, tamanho.altura),
    [cenario, tamanho],
  );

  const ratos: RatoAtual[] = useMemo(() => {
    if (quadro) return quadro.ratos.map((visao) => ({ id: visao.id, posicao: visao.posicao, visao }));
    return cenario.ratos.map((posicao, i) => ({
      id: i + 1,
      posicao,
      semCaminho: !cenario.alcancavel[posicao.y * cenario.largura + posicao.x],
    }));
  }, [cenario, quadro]);

  useEffect(() => {
    animador.current.atualizarAlvos(ratos, cenario.queijo, performance.now());
  }, [ratos, cenario.queijo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || tamanho.largura === 0) return;
    const escala = window.devicePixelRatio || 1;
    canvas.width = Math.round(tamanho.largura * escala);
    canvas.height = Math.round(tamanho.altura * escala);

    tema.current = lerTema(canvas);
    const camada = document.createElement("canvas");
    camada.width = canvas.width;
    camada.height = canvas.height;
    const ctx = camada.getContext("2d");
    if (ctx) {
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
      desenharParedes(ctx, geometria, cenario, tema.current);
    }
    camadaParedes.current = camada;
  }, [cenario, geometria, tamanho, versaoTema]);

  const dados = useRef({ cenario, geometria, ratos, quadro, tamanho, paredeRealcada, modoEdicao });
  dados.current = { cenario, geometria, ratos, quadro, tamanho, paredeRealcada, modoEdicao };

  useEffect(() => {
    let quadroAnimacao = 0;
    const desenhar = () => {
      quadroAnimacao = requestAnimationFrame(desenhar);
      const agora = performance.now();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const d = dados.current;
      if (!canvas || !ctx || !camadaParedes.current || !tema.current || d.tamanho.largura === 0) {
        return;
      }

      const posicoes = animador.current.quadro(agora);
      const escala = canvas.width / d.tamanho.largura;
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
      desenharCena(ctx, {
        geo: d.geometria,
        cenario: d.cenario,
        paredes: camadaParedes.current,
        ratos: d.ratos.map((rato) => {
          const animado = posicoes.get(rato.id);
          return {
            id: rato.id,
            x: animado?.x ?? rato.posicao.x,
            y: animado?.y ?? rato.posicao.y,
            angulo: animado?.angulo ?? 0,
            movimento: animado?.movimento ?? 0,
            visao: rato.visao,
            semCaminho: rato.semCaminho,
          };
        }),
        mostrarInalcancaveis: d.quadro === null,
        paredeRealcada: d.modoEdicao ? d.paredeRealcada : null,
        tema: tema.current,
        tempo: agora,
        larguraTela: d.tamanho.largura,
        alturaTela: d.tamanho.altura,
      });
    };
    quadroAnimacao = requestAnimationFrame(desenhar);
    return () => cancelAnimationFrame(quadroAnimacao);
  }, []);

  function paredeNoEvento(evento: MouseEvent<HTMLCanvasElement>) {
    const caixa = evento.currentTarget.getBoundingClientRect();
    return paredeSobCursor(
      geometria,
      cenario,
      evento.clientX - caixa.left,
      evento.clientY - caixa.top,
    );
  }

  function aoMover(evento: MouseEvent<HTMLCanvasElement>) {
    if (!modoEdicao) return;
    const alvo = paredeNoEvento(evento);
    setParedeRealcada((atual) =>
      atual?.x === alvo?.x && atual?.y === alvo?.y && atual?.direcao === alvo?.direcao
        ? atual
        : alvo,
    );
  }

  function aoClicar(evento: MouseEvent<HTMLCanvasElement>) {
    if (!modoEdicao) return;
    const alvo = paredeNoEvento(evento);
    if (alvo) aoAlternarParede(alvo.x, alvo.y, alvo.direcao);
  }

  return (
    <div ref={containerRef} className={`labirinto ${modoEdicao ? "labirinto--edicao" : ""}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={aoMover}
        onMouseLeave={() => setParedeRealcada(null)}
        onClick={aoClicar}
      />
    </div>
  );
}
