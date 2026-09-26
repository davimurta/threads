import { BIT_PAREDE, type Cenario, type Direcao, type Posicao, type VisaoRato } from "../../api/tipos";
import { corDoRato } from "../../util/ratos";
import { desenharRato } from "./desenhoRato";

export interface Geometria {
  celula: number;
  origemX: number;
  origemY: number;
}

export interface ParedeAlvo {
  x: number;
  y: number;
  direcao: Direcao;
}

export interface Tema {
  piso: string;
  parede: string;
  grade: string;
  morta: string;
  inalcancavel: string;
  realce: string;
  contornoRato: string;
}

export interface RatoNaTela {
  id: number;
  x: number;
  y: number;
  angulo: number;
  movimento: number;
  visao?: VisaoRato;
  semCaminho?: boolean;
}

const MARGEM = 24;

export function lerTema(elemento: Element): Tema {
  const estilo = getComputedStyle(elemento);
  const ler = (nome: string) => estilo.getPropertyValue(nome).trim();
  return {
    piso: ler("--lab-piso"),
    parede: ler("--lab-parede"),
    grade: ler("--lab-grade"),
    morta: ler("--lab-morta"),
    inalcancavel: ler("--lab-inalcancavel"),
    realce: ler("--lab-realce"),
    contornoRato: ler("--lab-contorno-rato"),
  };
}

export function calcularGeometria(cenario: Cenario, largura: number, altura: number): Geometria {
  const celula = Math.max(
    4,
    Math.floor(
      Math.min((largura - MARGEM * 2) / cenario.largura, (altura - MARGEM * 2) / cenario.altura),
    ),
  );
  return {
    celula,
    origemX: Math.round((largura - celula * cenario.largura) / 2),
    origemY: Math.round((altura - celula * cenario.altura) / 2),
  };
}

export function paredeSobCursor(
  geo: Geometria,
  cenario: Cenario,
  px: number,
  py: number,
): ParedeAlvo | null {
  const gx = (px - geo.origemX) / geo.celula;
  const gy = (py - geo.origemY) / geo.celula;
  const x = Math.floor(gx);
  const y = Math.floor(gy);
  if (x < 0 || y < 0 || x >= cenario.largura || y >= cenario.altura) return null;

  const fx = gx - x;
  const fy = gy - y;
  const distancias: [Direcao, number][] = [
    ["cima", fy],
    ["baixo", 1 - fy],
    ["esquerda", fx],
    ["direita", 1 - fx],
  ];
  const [direcao] = distancias.reduce((a, b) => (b[1] < a[1] ? b : a));

  const naBorda =
    (direcao === "cima" && y === 0) ||
    (direcao === "esquerda" && x === 0) ||
    (direcao === "baixo" && y === cenario.altura - 1) ||
    (direcao === "direita" && x === cenario.largura - 1);
  return naBorda ? null : { x, y, direcao };
}

export function desenharParedes(
  ctx: CanvasRenderingContext2D,
  { celula, origemX, origemY }: Geometria,
  cenario: Cenario,
  tema: Tema,
) {
  if (celula >= 14) {
    ctx.fillStyle = tema.grade;
    const raio = Math.max(1, celula * 0.035);
    for (let y = 1; y < cenario.altura; y++) {
      for (let x = 1; x < cenario.largura; x++) {
        ctx.beginPath();
        ctx.arc(origemX + x * celula, origemY + y * celula, raio, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.strokeStyle = tema.parede;
  ctx.lineWidth = Math.max(2, celula * 0.1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let y = 0; y < cenario.altura; y++) {
    for (let x = 0; x < cenario.largura; x++) {
      const bits = cenario.paredes[y * cenario.largura + x];
      const x0 = origemX + x * celula;
      const y0 = origemY + y * celula;
      if (bits & BIT_PAREDE.cima) linha(ctx, x0, y0, x0 + celula, y0);
      if (bits & BIT_PAREDE.esquerda) linha(ctx, x0, y0, x0, y0 + celula);
      if (x === cenario.largura - 1 && bits & BIT_PAREDE.direita)
        linha(ctx, x0 + celula, y0, x0 + celula, y0 + celula);
      if (y === cenario.altura - 1 && bits & BIT_PAREDE.baixo)
        linha(ctx, x0, y0 + celula, x0 + celula, y0 + celula);
    }
  }
  ctx.stroke();
}

interface Cena {
  geo: Geometria;
  cenario: Cenario;
  paredes: HTMLCanvasElement;
  ratos: RatoNaTela[];
  mostrarInalcancaveis: boolean;
  paredeRealcada: ParedeAlvo | null;
  tema: Tema;
  tempo: number;
  larguraTela: number;
  alturaTela: number;
}

export function desenharCena(ctx: CanvasRenderingContext2D, cena: Cena) {
  const { geo, cenario, tema } = cena;
  const { celula, origemX, origemY } = geo;
  const centro = (p: Posicao): [number, number] => [
    origemX + (p.x + 0.5) * celula,
    origemY + (p.y + 0.5) * celula,
  ];

  ctx.clearRect(0, 0, cena.larguraTela, cena.alturaTela);

  const larguraLab = celula * cenario.largura;
  const alturaLab = celula * cenario.altura;
  ctx.fillStyle = tema.piso;
  retanguloArredondado(ctx, origemX, origemY, larguraLab, alturaLab, Math.max(2, celula * 0.12));
  ctx.fill();

  if (cena.mostrarInalcancaveis) {
    ctx.fillStyle = tema.inalcancavel;
    cenario.alcancavel.forEach((alcancavel, i) => {
      if (alcancavel) return;
      const x = i % cenario.largura;
      const y = Math.floor(i / cenario.largura);
      ctx.fillRect(origemX + x * celula, origemY + y * celula, celula, celula);
    });
  }

  const recuo = celula * 0.1;
  ctx.fillStyle = tema.morta;
  for (const rato of cena.ratos) {
    for (const p of rato.visao?.mortas ?? []) {
      retanguloArredondado(
        ctx,
        origemX + p.x * celula + recuo,
        origemY + p.y * celula + recuo,
        celula - recuo * 2,
        celula - recuo * 2,
        celula * 0.18,
      );
      ctx.fill();
    }
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(2, celula * 0.16);
  ctx.globalAlpha = 0.45;
  for (const rato of cena.ratos) {
    const caminho = rato.visao?.caminho;
    if (!caminho || caminho.length < 2) continue;
    ctx.strokeStyle = corDoRato(rato.id);
    ctx.beginPath();
    caminho.slice(0, -1).forEach((p, i) => {
      const [cx, cy] = centro(p);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.lineTo(origemX + (rato.x + 0.5) * celula, origemY + (rato.y + 0.5) * celula);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.drawImage(cena.paredes, 0, 0, cena.larguraTela, cena.alturaTela);

  if (cena.paredeRealcada) desenharParedeRealcada(ctx, geo, cenario, cena.paredeRealcada, tema);

  desenharQueijo(ctx, centro(cenario.queijo), celula, tema, cena.tempo);

  const ordenados = [...cena.ratos].sort(
    (a, b) => (b.visao?.ordemChegada ?? 99) - (a.visao?.ordemChegada ?? 99),
  );
  for (const rato of ordenados) {
    const status = rato.visao?.status;
    desenharRato(
      ctx,
      origemX + (rato.x + 0.5) * celula,
      origemY + (rato.y + 0.5) * celula,
      {
        cor: corDoRato(rato.id),
        contorno: tema.contornoRato,
        celula,
        angulo: rato.angulo,
        tempo: cena.tempo,
        movimento: rato.movimento,
        fase: rato.id * 1.7,
        apagado: status === "preso" || status === "interrompido" || rato.semCaminho,
        vencedor: rato.visao?.ordemChegada === 1,
        realce: tema.realce,
      },
    );
  }
}

function desenharQueijo(
  ctx: CanvasRenderingContext2D,
  [cx, cy]: [number, number],
  celula: number,
  tema: Tema,
  tempo: number,
) {
  const pulso = 0.5 + Math.sin(tempo / 500) * 0.5;
  const brilho = ctx.createRadialGradient(cx, cy, 0, cx, cy, celula * (0.62 + pulso * 0.08));
  brilho.addColorStop(0, tema.realce);
  brilho.addColorStop(1, "transparent");
  ctx.save();
  ctx.globalAlpha = 0.28 + pulso * 0.12;
  ctx.fillStyle = brilho;
  ctx.beginPath();
  ctx.arc(cx, cy, celula * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const s = celula;
  const ponto = (x: number, y: number): [number, number] => [cx + x * s, cy + y * s];
  const poligono = (pontos: [number, number][], cor: string) => {
    ctx.beginPath();
    pontos.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(...ponto(x, y)) : ctx.lineTo(...ponto(x, y))));
    ctx.closePath();
    ctx.fillStyle = cor;
    ctx.fill();
    ctx.stroke();
  };
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
  poligono([[-0.32, 0.02], [0.32, -0.14], [0.1, -0.26]], "#ffd872");
  poligono([[-0.32, 0.02], [0.32, -0.14], [0.32, 0.22], [-0.32, 0.22]], "#f5b83d");
  ctx.fillStyle = "#d8942a";
  for (const [x, y, r] of [[0.14, 0.06, 0.06], [-0.12, 0.14, 0.045], [0.25, 0.15, 0.035]]) {
    ctx.beginPath();
    ctx.arc(...ponto(x, y), r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function desenharParedeRealcada(
  ctx: CanvasRenderingContext2D,
  { celula, origemX, origemY }: Geometria,
  cenario: Cenario,
  alvo: ParedeAlvo,
  tema: Tema,
) {
  const x0 = origemX + alvo.x * celula;
  const y0 = origemY + alvo.y * celula;
  const segmentos: Record<Direcao, [number, number, number, number]> = {
    cima: [x0, y0, x0 + celula, y0],
    baixo: [x0, y0 + celula, x0 + celula, y0 + celula],
    esquerda: [x0, y0, x0, y0 + celula],
    direita: [x0 + celula, y0, x0 + celula, y0 + celula],
  };
  const existe =
    (cenario.paredes[alvo.y * cenario.largura + alvo.x] & BIT_PAREDE[alvo.direcao]) !== 0;
  ctx.save();
  ctx.strokeStyle = tema.realce;
  ctx.lineWidth = Math.max(3, celula * 0.16);
  ctx.lineCap = "round";
  if (!existe) ctx.setLineDash([celula * 0.15, celula * 0.12]);
  ctx.beginPath();
  linha(ctx, ...segmentos[alvo.direcao]);
  ctx.stroke();
  ctx.restore();
}

function linha(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
}

function retanguloArredondado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  largura: number,
  altura: number,
  raio: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, largura, altura, raio);
}
