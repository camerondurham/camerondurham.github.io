use leptos::*;
use crate::data::get_posts;

#[component]
pub fn Posts() -> impl IntoView {
    let posts = get_posts();

    view! {
        <div class="container">
            <h1>"Posts"</h1>
            <div class="posts-list">
                {posts.into_iter().map(|post| {
                    view! {
                        <article class="post-item">
                            <h2>{post.title}</h2>
                            <time datetime={post.date.clone()}>{post.date}</time>
                            <p>{post.content}</p>
                        </article>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
