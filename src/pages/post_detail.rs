use leptos::*;
use leptos_router::*;
use pulldown_cmark::{Parser, Options, html};
use crate::data::get_post_by_slug;

fn markdown_to_html(content: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);

    let parser = Parser::new_ext(content, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);
    html_output
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
                    let html_content = markdown_to_html(&p.content);
                    view! {
                        <article class="post-detail">
                            <header class="post-header">
                                <h1>{p.title}</h1>
                                <time datetime={p.date.clone()}>{p.date}</time>
                            </header>
                            <div class="post-content" inner_html={html_content}></div>
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
