use leptos::*;
use leptos_router::*;
use crate::data::get_posts;

#[component]
pub fn Posts() -> impl IntoView {
    let posts = get_posts();

    view! {
        <div class="container">
            <h1>"Posts"</h1>
            <div class="posts-list">
                {posts.into_iter().map(|post| {
                    let post_url = format!("/posts/{}", post.slug);
                    view! {
                        <article class="post-item">
                            <h2>
                                <A href={post_url}>{post.title}</A>
                            </h2>
                            <time datetime={post.date.clone()}>{post.date}</time>
                            <p>{post.summary}</p>
                            <A href={format!("/posts/{}", post.slug)} class="read-more">"Read more →"</A>
                        </article>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
