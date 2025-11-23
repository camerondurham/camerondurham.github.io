use leptos::*;
use leptos_router::*;
use crate::data::{get_menu_items, get_socials};

#[component]
pub fn Nav() -> impl IntoView {
    let menu_items = get_menu_items();
    let socials = get_socials();

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
                </div>
            </div>
        </nav>
    }
}
