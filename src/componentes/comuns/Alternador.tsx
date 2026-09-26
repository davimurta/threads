import "./comuns.css";

interface Props {
  rotulo: string;
  descricao?: string;
  ligado: boolean;
  desabilitado?: boolean;
  aoMudar: (ligado: boolean) => void;
}

export function Alternador({ rotulo, descricao, ligado, desabilitado, aoMudar }: Props) {
  return (
    <label className={`alternador ${desabilitado ? "campo--desabilitado" : ""}`}>
      <input
        type="checkbox"
        checked={ligado}
        disabled={desabilitado}
        onChange={(e) => aoMudar(e.target.checked)}
      />
      <span className="alternador__trilho" aria-hidden />
      <span className="alternador__texto">
        <span>{rotulo}</span>
        {descricao && <span className="alternador__descricao">{descricao}</span>}
      </span>
    </label>
  );
}
