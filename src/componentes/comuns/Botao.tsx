import type { ButtonHTMLAttributes } from "react";
import "./comuns.css";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "perigo";
}

export function Botao({ variante = "secundario", className = "", ...resto }: Props) {
  return <button type="button" className={`botao botao--${variante} ${className}`} {...resto} />;
}
