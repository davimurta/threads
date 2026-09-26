use crate::modelo::Posicao;
use serde::Serialize;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum StatusRato {
    AguardandoLargada,
    Explorando,
    Retrocedendo,
    Chegou,
    Preso,
    Interrompido,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VisaoRato {
    pub id: usize,
    pub posicao: Posicao,
    pub caminho: Vec<Posicao>,
    pub mortas: Vec<Posicao>,
    pub passos: u32,
    pub retrocessos: u32,
    pub status: StatusRato,
    pub ordem_chegada: Option<usize>,
}

impl VisaoRato {
    pub fn nova(id: usize, inicio: Posicao) -> Self {
        Self {
            id,
            posicao: inicio,
            caminho: vec![inicio],
            mortas: Vec::new(),
            passos: 0,
            retrocessos: 0,
            status: StatusRato::AguardandoLargada,
            ordem_chegada: None,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EntradaLog {
    pub tempo_ms: u64,
    pub rato: Option<usize>,
    pub mensagem: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Fase {
    Rodando,
    Pausada,
    Finalizada,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Quadro {
    pub id: u64,
    pub fase: Fase,
    pub tempo_ms: u64,
    pub ratos: Vec<VisaoRato>,
    pub log: Vec<EntradaLog>,
    pub vencedor: Option<usize>,
}
