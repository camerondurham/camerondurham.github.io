use leptos::*;
use leptos_meta::*;
use leptos_router::*;

mod app;
mod components;
mod data;
mod pages;

pub use app::App;

#[wasm_bindgen::prelude::wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
    leptos::mount_to_body(App);
}
