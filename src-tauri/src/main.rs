#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(debug_assertions)]
// use tauri::Manager;
use tauri_runtime_verso::{
  set_verso_devtools_port, set_verso_path, set_verso_resource_directory, VersoRuntime,
  INVOKE_SYSTEM_SCRIPTS,
};

fn main() {
  // #[cfg(debug_assertions)]
  // let builder = tauri::Builder::default().plugin(tauri_plugin_devtools::init());
  // #[cfg(not(debug_assertions))]
  // let builder = tauri::Builder::default();

  // You need to set this to the path of the versoview executable
  // before creating any of the webview windows
  set_verso_path(r"C:\Users\Jacob\Documents\dev\github\jbolda\stream-todo\versoview\versoview.exe");
  // set_verso_path("../versoview/versoview.exe");
  // Set this to verso/servo's resources directory before creating any of the webview windows
  // this is optional but recommended, this directory will include very important things
  // like user agent stylesheet
  set_verso_resource_directory(r"C:\Users\Jacob\AppData\Local\verso\resources");

  // as well as using these directories, we set the following env vars
  // $env.PRE_BUILT_VERSOVIEW = 'C:\Users\Jacob\Documents\dev\github\jbolda\stream-todo\versoview'

  set_verso_devtools_port(5333);

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
