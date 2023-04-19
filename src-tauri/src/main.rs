// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::{distributions::Alphanumeric, Rng};

fn generate_serial() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(10)
        .map(char::from)
        .collect()
}

#[tauri::command]
fn generate_serials(count: u32) -> Vec<String> {
    let mut serials = Vec::new();

    for _ in 0..count {
        serials.push(generate_serial());
    }

    serials
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_serials])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
