use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("polyfill")
        .js_init_script(include_str!("../polyfill-iife.js").to_string())
        .build()
}
