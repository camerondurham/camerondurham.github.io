use leptos::*;
use leptos_router::*;
use crate::data::get_post_by_slug;

fn render_content(content: &str) -> Vec<View> {
    content.lines().map(|line| {
        let line = line.to_string();
        if line.starts_with("### ") {
            let heading = line.trim_start_matches("### ").to_string();
            view! { <h3>{heading}</h3> }.into_view()
        } else if line.starts_with("- ") {
            view! { <p class="list-item">{line}</p> }.into_view()
        } else if line.starts_with("|") {
            view! { <p class="table-row"><code>{line}</code></p> }.into_view()
        } else if line.is_empty() {
            view! { <br/> }.into_view()
        } else {
            view! { <p>{line}</p> }.into_view()
        }
    }).collect()
}

#[component]
pub fn PostDetail() -> impl IntoView {
    let params = use_params_map();

    let post = move || {
        let slug = params.with(|p| p.get("slug").cloned().unwrap_or_default());
        get_post_by_slug(&slug)
    };

    view! {
        <div class="container">
            {move || match post() {
                Some(p) => {
                    let content_views = render_content(&p.content);
                    view! {
                        <article class="post-detail">
                            <header class="post-header">
                                <h1>{p.title}</h1>
                                <time datetime={p.date.clone()}>{p.date}</time>
                            </header>
                            <div class="post-content">
                                {content_views}
                            </div>
                            <footer class="post-footer">
                                <A href="/posts" class="back-link">"← Back to posts"</A>
                            </footer>
                        </article>
                    }.into_view()
                },
                None => view! {
                    <div class="not-found">
                        <h1>"Post not found"</h1>
                        <p>"The post you're looking for doesn't exist."</p>
                        <A href="/posts">"← Back to posts"</A>
                    </div>
                }.into_view(),
            }}
        </div>
    }
}
