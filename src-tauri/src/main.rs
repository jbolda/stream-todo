#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(debug_assertions)]
// use tauri::Manager;
use tauri_runtime_verso::{set_verso_devtools_port, VersoRuntime, INVOKE_SYSTEM_SCRIPTS};

fn main() {
  // #[cfg(debug_assertions)]
  // let builder = tauri::Builder::default().plugin(tauri_plugin_devtools::init());
  // #[cfg(not(debug_assertions))]
  // let builder = tauri::Builder::default();

  set_verso_devtools_port(1234);

  tauri::Builder::<VersoRuntime>::new()
    // builder
    //   .setup(|_app| {
    //     #[cfg(debug_assertions)]
    //     {
    //       let window = _app.get_webview_window("main").unwrap();
    //       window.open_devtools();
    //     }
    //     Ok(())
    //   })
    .invoke_system(INVOKE_SYSTEM_SCRIPTS.to_owned())
    .plugin(tauri_plugin_polyfill::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_positioner::init())
    .plugin(tauri_plugin_notification::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
