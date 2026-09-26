interface Props {
  cor: string;
  tamanho?: number;
}

export function IconeRato({ cor, tamanho = 24 }: Props) {
  return (
    <svg width={tamanho} height={tamanho * 0.5} viewBox="-60 -24 100 48" aria-hidden style={{ flex: "none" }}>
      <path d="M-24 0 C-36 8 -44 -12 -56 6" fill="none" stroke="#f2a7b5" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="-3" cy="0" rx="25" ry="17" fill={cor} stroke="rgba(0,0,0,.3)" strokeWidth="3" />
      <path d="M8 -13 Q30 -10 37 0 Q30 10 8 13 Z" fill={cor} stroke="rgba(0,0,0,.3)" strokeWidth="3" />
      <circle cx="12" cy="-13" r="7.5" fill={cor} stroke="rgba(0,0,0,.3)" strokeWidth="3" />
      <circle cx="12" cy="13" r="7.5" fill={cor} stroke="rgba(0,0,0,.3)" strokeWidth="3" />
      <circle cx="12.5" cy="-13.5" r="4.2" fill="#f2a7b5" />
      <circle cx="12.5" cy="13.5" r="4.2" fill="#f2a7b5" />
      <circle cx="25" cy="-5" r="2.4" fill="#1b1b1f" />
      <circle cx="25" cy="5" r="2.4" fill="#1b1b1f" />
      <circle cx="37" cy="0" r="3" fill="#f2a7b5" />
    </svg>
  );
}
