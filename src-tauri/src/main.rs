#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::tray::TrayIconBuilder;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_positioner::init())
    // This is required to get tray-relative positions to work
    .setup(|app| {
      TrayIconBuilder::new()
        .on_tray_icon_event(|app, event| {
          tauri_plugin_positioner::on_tray_event(app.app_handle(), &event);
        })
        .build(app)?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
