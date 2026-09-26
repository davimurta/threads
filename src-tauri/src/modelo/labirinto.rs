use super::posicao::{Direcao, Posicao};
use std::collections::VecDeque;

const TODAS_AS_PAREDES: u8 = 0b1111;

#[derive(Clone, Debug)]
pub struct Labirinto {
    largura: usize,
    altura: usize,
    paredes: Vec<u8>,
}

impl Labirinto {
    pub fn fechado(largura: usize, altura: usize) -> Self {
        Self {
            largura,
            altura,
            paredes: vec![TODAS_AS_PAREDES; largura * altura],
        }
    }

    pub fn largura(&self) -> usize {
        self.largura
    }

    pub fn altura(&self) -> usize {
        self.altura
    }

    pub fn total_celulas(&self) -> usize {
        self.paredes.len()
    }

    pub fn paredes(&self) -> &[u8] {
        &self.paredes
    }

    pub fn contem(&self, p: Posicao) -> bool {
        p.x < self.largura && p.y < self.altura
    }

    pub fn indice(&self, p: Posicao) -> usize {
        p.y * self.largura + p.x
    }

    pub fn posicao(&self, indice: usize) -> Posicao {
        Posicao::nova(indice % self.largura, indice / self.largura)
    }

    pub fn vizinho(&self, p: Posicao, direcao: Direcao) -> Option<Posicao> {
        let (dx, dy) = direcao.deslocamento();
        let x = p.x.checked_add_signed(dx)?;
        let y = p.y.checked_add_signed(dy)?;
        let destino = Posicao::nova(x, y);
        self.contem(destino).then_some(destino)
    }

    pub fn tem_parede(&self, p: Posicao, direcao: Direcao) -> bool {
        self.paredes[self.indice(p)] & direcao.bit() != 0
    }

    pub fn mover(&self, p: Posicao, direcao: Direcao) -> Option<Posicao> {
        if self.tem_parede(p, direcao) {
            None
        } else {
            self.vizinho(p, direcao)
        }
    }

    pub fn definir_parede(&mut self, p: Posicao, direcao: Direcao, existe: bool) -> bool {
        let Some(vizinho) = self.vizinho(p, direcao) else {
            return false;
        };
        let (a, b) = (self.indice(p), self.indice(vizinho));
        if existe {
            self.paredes[a] |= direcao.bit();
            self.paredes[b] |= direcao.oposta().bit();
        } else {
            self.paredes[a] &= !direcao.bit();
            self.paredes[b] &= !direcao.oposta().bit();
        }
        true
    }

    pub fn alternar_parede(&mut self, p: Posicao, direcao: Direcao) -> bool {
        let existe = !self.tem_parede(p, direcao);
        self.definir_parede(p, direcao, existe)
    }

    pub fn alcancaveis_a_partir(&self, origem: Posicao) -> Vec<bool> {
        let mut alcancavel = vec![false; self.total_celulas()];
        let mut fila = VecDeque::from([origem]);
        alcancavel[self.indice(origem)] = true;

        while let Some(atual) = fila.pop_front() {
            for direcao in Direcao::TODAS {
                if let Some(proxima) = self.mover(atual, direcao) {
                    let i = self.indice(proxima);
                    if !alcancavel[i] {
                        alcancavel[i] = true;
                        fila.push_back(proxima);
                    }
                }
            }
        }
        alcancavel
    }
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn parede_e_atualizada_nos_dois_lados() {
        let mut lab = Labirinto::fechado(3, 3);
        let p = Posicao::nova(1, 1);
        assert!(lab.definir_parede(p, Direcao::Direita, false));
        assert!(!lab.tem_parede(p, Direcao::Direita));
        assert!(!lab.tem_parede(Posicao::nova(2, 1), Direcao::Esquerda));
    }

    #[test]
    fn borda_externa_e_fixa() {
        let mut lab = Labirinto::fechado(3, 3);
        assert!(!lab.alternar_parede(Posicao::nova(0, 0), Direcao::Cima));
        assert!(lab.tem_parede(Posicao::nova(0, 0), Direcao::Cima));
    }
}
