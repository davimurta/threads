use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Posicao {
    pub x: usize,
    pub y: usize,
}

impl Posicao {
    pub const fn nova(x: usize, y: usize) -> Self {
        Self { x, y }
    }
}

impl fmt::Display for Posicao {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}, {}]", self.x, self.y)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Direcao {
    Cima,
    Direita,
    Baixo,
    Esquerda,
}

impl Direcao {
    pub const TODAS: [Direcao; 4] = [
        Direcao::Cima,
        Direcao::Direita,
        Direcao::Baixo,
        Direcao::Esquerda,
    ];

    pub const fn bit(self) -> u8 {
        match self {
            Direcao::Cima => 1,
            Direcao::Direita => 2,
            Direcao::Baixo => 4,
            Direcao::Esquerda => 8,
        }
    }

    pub const fn oposta(self) -> Direcao {
        match self {
            Direcao::Cima => Direcao::Baixo,
            Direcao::Direita => Direcao::Esquerda,
            Direcao::Baixo => Direcao::Cima,
            Direcao::Esquerda => Direcao::Direita,
        }
    }

    pub const fn deslocamento(self) -> (isize, isize) {
        match self {
            Direcao::Cima => (0, -1),
            Direcao::Direita => (1, 0),
            Direcao::Baixo => (0, 1),
            Direcao::Esquerda => (-1, 0),
        }
    }
}
