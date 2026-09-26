export interface EstiloRato {
  cor: string;
  contorno: string;
  celula: number;
  angulo: number;
  tempo: number;
  movimento: number;
  fase: number;
  apagado?: boolean;
  vencedor?: boolean;
  realce?: string;
}

const ROSA = "#f2a7b5";
const OLHO = "#1b1b1f";

export function desenharRato(ctx: CanvasRenderingContext2D, cx: number, cy: number, e: EstiloRato) {
  const s = e.celula * 1.2;
  const t = e.tempo / 1000 + e.fase;
  const velocidadeCauda = 3 + e.movimento * 11;
  const onda = Math.sin(t * velocidadeCauda);
  const passo = Math.sin(t * 22) * e.movimento;
  const pulo = e.vencedor ? Math.abs(Math.sin(t * 5)) * s * 0.06 : 0;
  const escala = 1 + (e.vencedor ? Math.sin(t * 5) * 0.03 : Math.sin(t * 2.2) * 0.012);

  ctx.save();
  ctx.translate(cx, cy - pulo);
  ctx.globalAlpha = e.apagado ? 0.4 : 1;

  if (e.vencedor && e.realce) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(t * 5) * 0.15;
    ctx.fillStyle = e.realce;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.rotate(e.angulo);
  ctx.scale(escala, escala);

  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.beginPath();
  ctx.ellipse(-s * 0.02, s * 0.04, s * 0.3, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ROSA;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, s * 0.045);
  ctx.beginPath();
  ctx.moveTo(-s * 0.24, 0);
  ctx.bezierCurveTo(
    -s * 0.36, onda * s * 0.1,
    -s * 0.44, -onda * s * 0.14,
    -s * 0.56, onda * s * 0.08,
  );
  ctx.stroke();

  ctx.fillStyle = ROSA;
  for (const [px, lado, deslocamento] of [
    [0.12, 1, passo],
    [0.12, -1, -passo],
    [-0.14, 1, -passo],
    [-0.14, -1, passo],
  ]) {
    ctx.beginPath();
    ctx.arc(s * (px + deslocamento * 0.035), lado * s * 0.17, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = e.cor;
  ctx.strokeStyle = e.contorno;
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.beginPath();
  ctx.ellipse(-s * 0.03, 0, s * 0.25, s * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(s * 0.08, -s * 0.13);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.1, s * 0.37, 0);
  ctx.quadraticCurveTo(s * 0.3, s * 0.1, s * 0.08, s * 0.13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  for (const lado of [1, -1]) {
    ctx.fillStyle = e.cor;
    ctx.beginPath();
    ctx.arc(s * 0.12, lado * s * 0.13, s * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ROSA;
    ctx.beginPath();
    ctx.arc(s * 0.125, lado * s * 0.135, s * 0.042, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = OLHO;
  for (const lado of [1, -1]) {
    ctx.beginPath();
    ctx.arc(s * 0.25, lado * s * 0.05, Math.max(0.8, s * 0.022), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = ROSA;
  ctx.beginPath();
  ctx.arc(s * 0.37, 0, Math.max(0.8, s * 0.028), 0, Math.PI * 2);
  ctx.fill();

  if (s >= 20) {
    ctx.strokeStyle = e.contorno;
    ctx.globalAlpha *= 0.55;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const lado of [1, -1]) {
      ctx.moveTo(s * 0.33, lado * s * 0.03);
      ctx.lineTo(s * 0.45, lado * s * 0.1);
      ctx.moveTo(s * 0.33, lado * s * 0.02);
      ctx.lineTo(s * 0.47, lado * s * 0.03);
    }
    ctx.stroke();
  }

  ctx.restore();
}
