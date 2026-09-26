use crate::estado_app::{Cenario, EstadoApp};
use crate::modelo::{Aleatorio, Direcao, Posicao, QUEIJO};
use crate::simulacao::{ConfigSimulacao, Simulacao};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

const EVENTO_QUADRO: &str = "simulacao:quadro";

const LADO_MIN: usize = 5;
const LADO_MAX: usize = 40;
const RATOS_MAX: usize = 12;
const CICLOS_MAX: u8 = 40;
const INTERVALO_MIN: u64 = 5;
const INTERVALO_MAX: u64 = 1000;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CenarioDto {
    largura: usize,
    altura: usize,
    paredes: Vec<u8>,
    queijo: Posicao,
    ratos: Vec<Posicao>,
    alcancavel: Vec<bool>,
    semente: u64,
}

impl From<&Cenario> for CenarioDto {
    fn from(cenario: &Cenario) -> Self {
        let lab = &cenario.labirinto;
        Self {
            largura: lab.largura(),
            altura: lab.altura(),
            paredes: lab.paredes().to_vec(),
            queijo: QUEIJO,
            ratos: cenario.ratos.clone(),
            alcancavel: lab.alcancaveis_a_partir(QUEIJO),
            semente: cenario.semente,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParametrosLabirinto {
    largura: usize,
    altura: usize,
    quantidade_ratos: usize,
    ciclos: u8,
    semente: Option<u64>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpcoesSimulacao {
    id: u64,
    intervalo_ms: u64,
    parar_no_primeiro: bool,
}

#[tauri::command]
pub async fn obter_cenario(estado: State<'_, EstadoApp>) -> Result<CenarioDto, String> {
    Ok(CenarioDto::from(&*estado.cenario.lock().unwrap()))
}

#[tauri::command]
pub async fn gerar_labirinto(
    estado: State<'_, EstadoApp>,
    parametros: ParametrosLabirinto,
) -> Result<CenarioDto, String> {
    estado.encerrar_simulacao();
    let largura = parametros.largura.clamp(LADO_MIN, LADO_MAX);
    let altura = parametros.altura.clamp(LADO_MIN, LADO_MAX);
    let ratos = parametros.quantidade_ratos.clamp(1, RATOS_MAX);
    let ciclos = f64::from(parametros.ciclos.min(CICLOS_MAX)) / 100.0;
    let semente = parametros
        .semente
        .unwrap_or_else(Aleatorio::semente_do_relogio);

    let mut cenario = estado.cenario.lock().unwrap();
    *cenario = Cenario::gerar(largura, altura, ratos, ciclos, semente);
    Ok(CenarioDto::from(&*cenario))
}

#[tauri::command]
pub async fn sortear_ratos(
    estado: State<'_, EstadoApp>,
    quantidade: usize,
) -> Result<CenarioDto, String> {
    estado.encerrar_simulacao();
    let mut cenario = estado.cenario.lock().unwrap();
    cenario.sortear_ratos(quantidade.clamp(1, RATOS_MAX));
    Ok(CenarioDto::from(&*cenario))
}

#[tauri::command]
pub async fn alternar_parede(
    estado: State<'_, EstadoApp>,
    x: usize,
    y: usize,
    direcao: Direcao,
) -> Result<CenarioDto, String> {
    estado.encerrar_simulacao();
    let mut cenario = estado.cenario.lock().unwrap();
    let posicao = Posicao::nova(x, y);
    if !cenario.labirinto.contem(posicao) {
        return Err("Posição fora do labirinto.".into());
    }
    if !cenario.labirinto.alternar_parede(posicao, direcao) {
        return Err("As paredes da borda externa não podem ser removidas.".into());
    }
    Ok(CenarioDto::from(&*cenario))
}

#[tauri::command]
pub async fn iniciar_simulacao(
    app: AppHandle,
    estado: State<'_, EstadoApp>,
    opcoes: OpcoesSimulacao,
) -> Result<(), String> {
    estado.encerrar_simulacao();

    let mut cenario = estado.cenario.lock().unwrap();
    let alcancavel = cenario.labirinto.alcancaveis_a_partir(QUEIJO);
    let algum_chega = cenario
        .ratos
        .iter()
        .any(|&p| alcancavel[cenario.labirinto.indice(p)]);
    if !algum_chega {
        return Err(
            "Nenhum rato tem caminho até o queijo. Remova algumas paredes ou sorteie novas posições."
                .into(),
        );
    }

    let config = ConfigSimulacao {
        id: opcoes.id,
        intervalo_ms: opcoes.intervalo_ms.clamp(INTERVALO_MIN, INTERVALO_MAX),
        parar_no_primeiro: opcoes.parar_no_primeiro,
        semente: cenario.aleatorio.proximo(),
    };
    let simulacao = Simulacao::iniciar(
        cenario.labirinto.clone(),
        QUEIJO,
        &cenario.ratos,
        config,
        move |quadro| {
            let _ = app.emit(EVENTO_QUADRO, quadro);
        },
    );
    *estado.simulacao.lock().unwrap() = Some(simulacao);
    Ok(())
}

#[tauri::command]
pub async fn pausar_simulacao(estado: State<'_, EstadoApp>) -> Result<(), String> {
    if let Some(simulacao) = estado.simulacao.lock().unwrap().as_ref() {
        simulacao.pausar();
    }
    Ok(())
}

#[tauri::command]
pub async fn continuar_simulacao(estado: State<'_, EstadoApp>) -> Result<(), String> {
    if let Some(simulacao) = estado.simulacao.lock().unwrap().as_ref() {
        simulacao.continuar();
    }
    Ok(())
}

#[tauri::command]
pub async fn parar_simulacao(estado: State<'_, EstadoApp>) -> Result<(), String> {
    estado.encerrar_simulacao();
    Ok(())
}

#[tauri::command]
pub async fn definir_velocidade(
    estado: State<'_, EstadoApp>,
    intervalo_ms: u64,
) -> Result<(), String> {
    if let Some(simulacao) = estado.simulacao.lock().unwrap().as_ref() {
        simulacao.definir_intervalo(intervalo_ms.clamp(INTERVALO_MIN, INTERVALO_MAX));
    }
    Ok(())
}
