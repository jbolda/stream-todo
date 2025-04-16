use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Polyfill;
#[cfg(mobile)]
use mobile::Polyfill;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the polyfill APIs.
pub trait PolyfillExt<R: Runtime> {
  fn polyfill(&self) -> &Polyfill<R>;
}

impl<R: Runtime, T: Manager<R>> crate::PolyfillExt<R> for T {
  fn polyfill(&self) -> &Polyfill<R> {
    self.state::<Polyfill<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("polyfill")
    .invoke_handler(tauri::generate_handler![commands::ping])
    .setup(|app, api| {
      #[cfg(mobile)]
      let polyfill = mobile::init(app, api)?;
      #[cfg(desktop)]
      let polyfill = desktop::init(app, api)?;
      app.manage(polyfill);
      Ok(())
    })
    .build()
}
