import "./comuns.css";

interface Props {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  passo?: number;
  sufixo?: string;
  desabilitado?: boolean;
  aoMudar: (valor: number) => void;
}

export function CampoSlider({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  sufixo = "",
  desabilitado,
  aoMudar,
}: Props) {
  return (
    <label className={`campo ${desabilitado ? "campo--desabilitado" : ""}`}>
      <span className="campo__linha">
        <span>{rotulo}</span>
        <span className="campo__valor">
          {valor}
          {sufixo}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        disabled={desabilitado}
        onChange={(e) => aoMudar(Number(e.target.value))}
      />
    </label>
  );
}
