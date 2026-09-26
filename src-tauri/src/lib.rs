mod comandos;
mod estado_app;
mod modelo;
mod simulacao;

use estado_app::EstadoApp;

pub fn run() {
    tauri::Builder::default()
        .manage(EstadoApp::novo())
        .invoke_handler(tauri::generate_handler![
            comandos::obter_cenario,
            comandos::gerar_labirinto,
            comandos::sortear_ratos,
            comandos::alternar_parede,
            comandos::iniciar_simulacao,
            comandos::pausar_simulacao,
            comandos::continuar_simulacao,
            comandos::parar_simulacao,
            comandos::definir_velocidade,
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o aplicativo");
}
