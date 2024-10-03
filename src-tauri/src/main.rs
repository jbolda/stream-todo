#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  #[cfg(debug_assertions)]
  let builder = tauri::Builder::default().plugin(tauri_plugin_devtools::init());
  #[cfg(not(debug_assertions))]
  let builder = tauri::Builder::default();

  builder
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_positioner::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
