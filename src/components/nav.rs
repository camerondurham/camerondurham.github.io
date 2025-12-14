use leptos::*;
use leptos_router::*;
use crate::data::{get_menu_items, get_socials};

#[component]
pub fn Nav() -> impl IntoView {
    let menu_items = get_menu_items();
    let socials = get_socials();

    // Initialize theme from localStorage or system preference
    let (is_dark, set_is_dark) = create_signal(false);

    // Initialize theme on mount
    create_effect(move |_| {
        if let Some(window) = web_sys::window() {
            if let Some(document) = window.document() {
                if let Some(html) = document.document_element() {
                    // Check localStorage first
                    if let Ok(Some(storage)) = window.local_storage() {
                        if let Ok(Some(theme)) = storage.get_item("theme") {
                            let is_dark_mode = theme == "dark";
                            set_is_dark.set(is_dark_mode);

                            if is_dark_mode {
                                let _ = html.class_list().add_1("dark");
                            } else {
                                let _ = html.class_list().remove_1("dark");
                            }
                            return;
                        }
                    }

                    // Fall back to system preference
                    if let Ok(media_query) = window.match_media("(prefers-color-scheme: dark)") {
                        if let Some(mql) = media_query {
                            if mql.matches() {
                                set_is_dark.set(true);
                            }
                        }
                    }
                }
            }
        }
    });

    // Toggle theme function
    let toggle_theme = move |_| {
        let new_theme = !is_dark.get();
        set_is_dark.set(new_theme);

        if let Some(window) = web_sys::window() {
            if let Some(document) = window.document() {
                if let Some(html) = document.document_element() {
                    if new_theme {
                        let _ = html.class_list().add_1("dark");
                    } else {
                        let _ = html.class_list().remove_1("dark");
                    }
                }
            }

            // Save to localStorage
            if let Ok(Some(storage)) = window.local_storage() {
                let theme_value = if new_theme { "dark" } else { "light" };
                let _ = storage.set_item("theme", theme_value);
            }
        }
    };

    view! {
        <nav class="nav">
            <div class="nav-container">
                <div class="nav-header">
                    <A href="/" class="nav-title">
                        "Cameron Durham"
                    </A>
                </div>

                <div class="nav-links">
                    {menu_items.into_iter().map(|item| {
                        view! {
                            <A href={item.url} class="nav-link">
                                {item.name}
                            </A>
                        }
                    }).collect::<Vec<_>>()}
                </div>

                <div class="nav-socials">
                    {socials.into_iter().map(|social| {
                        view! {
                            <a href={social.url} target="_blank" rel="noopener noreferrer"
                               class="social-link" title={social.name.clone()}>
                                {social.icon}
                            </a>
                        }
                    }).collect::<Vec<_>>()}

                    <button
                        class="theme-toggle"
                        on:click=toggle_theme
                        aria-label="Toggle dark mode"
                        title="Toggle dark mode"
                    >
                        {move || if is_dark.get() { "☀" } else { "☾" }}
                    </button>
                </div>
            </div>
        </nav>
    }
}
