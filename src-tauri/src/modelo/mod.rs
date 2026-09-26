mod aleatorio;
mod gerador;
mod labirinto;
mod posicao;

pub use aleatorio::Aleatorio;
pub use gerador::{gerar_labirinto, sortear_posicoes};
pub use labirinto::Labirinto;
pub use posicao::{Direcao, Posicao};

pub const QUEIJO: Posicao = Posicao::nova(0, 0);
