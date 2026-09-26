use super::aleatorio::Aleatorio;
use super::labirinto::Labirinto;
use super::posicao::{Direcao, Posicao};

pub fn gerar_labirinto(
    largura: usize,
    altura: usize,
    ciclos: f64,
    aleatorio: &mut Aleatorio,
) -> Labirinto {
    let mut labirinto = Labirinto::fechado(largura, altura);
    let mut visitada = vec![false; labirinto.total_celulas()];

    let inicio = labirinto.posicao(aleatorio.intervalo(labirinto.total_celulas()));
    visitada[labirinto.indice(inicio)] = true;
    let mut pilha = vec![inicio];

    while let Some(&atual) = pilha.last() {
        let opcoes: Vec<(Direcao, Posicao)> = Direcao::TODAS
            .iter()
            .filter_map(|&d| labirinto.vizinho(atual, d).map(|p| (d, p)))
            .filter(|&(_, p)| !visitada[labirinto.indice(p)])
            .collect();

        if opcoes.is_empty() {
            pilha.pop();
            continue;
        }

        let (direcao, proxima) = opcoes[aleatorio.intervalo(opcoes.len())];
        labirinto.definir_parede(atual, direcao, false);
        visitada[labirinto.indice(proxima)] = true;
        pilha.push(proxima);
    }

    if ciclos > 0.0 {
        for indice in 0..labirinto.total_celulas() {
            let p = labirinto.posicao(indice);
            for direcao in [Direcao::Direita, Direcao::Baixo] {
                if labirinto.tem_parede(p, direcao) && aleatorio.chance(ciclos) {
                    labirinto.definir_parede(p, direcao, false);
                }
            }
        }
    }

    labirinto
}

pub fn sortear_posicoes(
    labirinto: &Labirinto,
    quantidade: usize,
    proibida: Posicao,
    aleatorio: &mut Aleatorio,
) -> Vec<Posicao> {
    let mut candidatas: Vec<Posicao> = (0..labirinto.total_celulas())
        .map(|i| labirinto.posicao(i))
        .filter(|&p| p != proibida)
        .collect();
    aleatorio.embaralhar(&mut candidatas);
    candidatas.truncate(quantidade);
    candidatas
}

#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn labirinto_gerado_e_totalmente_conectado() {
        for semente in 0..20 {
            let mut aleatorio = Aleatorio::novo(semente);
            let lab = gerar_labirinto(17, 11, 0.0, &mut aleatorio);
            let alcancavel = lab.alcancaveis_a_partir(Posicao::nova(0, 0));
            assert!(alcancavel.iter().all(|&a| a), "semente {semente}");
        }
    }

    #[test]
    fn mesma_semente_gera_mesmo_labirinto() {
        let a = gerar_labirinto(10, 10, 0.1, &mut Aleatorio::novo(42));
        let b = gerar_labirinto(10, 10, 0.1, &mut Aleatorio::novo(42));
        assert_eq!(a.paredes(), b.paredes());
    }

    #[test]
    fn posicoes_sorteadas_sao_distintas_e_evitam_o_queijo() {
        let lab = Labirinto::fechado(4, 4);
        let queijo = Posicao::nova(0, 0);
        let posicoes = sortear_posicoes(&lab, 15, queijo, &mut Aleatorio::novo(7));
        assert_eq!(posicoes.len(), 15);
        assert!(!posicoes.contains(&queijo));
        let mut unicas = posicoes.clone();
        unicas.sort_by_key(|p| (p.y, p.x));
        unicas.dedup();
        assert_eq!(unicas.len(), 15);
    }
}
