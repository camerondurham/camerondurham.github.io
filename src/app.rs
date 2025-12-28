use leptos::*;
use leptos_meta::*;
use leptos_router::*;

use crate::components::nav::Nav;
use crate::pages::{home::Home, posts::Posts, post_detail::PostDetail, projects::Projects, photos::Photos};

#[component]
pub fn App() -> impl IntoView {
    provide_meta_context();

    view! {
        <Html lang="en"/>
        <Meta charset="utf-8"/>
        <Meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <Title text="u64.cam"/>

        <Router>
            <Nav/>
            <main class="main-content">
                <Routes>
                    <Route path="/" view=Home/>
                    <Route path="/posts" view=Posts/>
                    <Route path="/posts/:slug" view=PostDetail/>
                    <Route path="/projects" view=Projects/>
                    <Route path="/photos" view=Photos/>
                    <Route path="/codecanvas" view=|| view! { <div>"CodeCanvas - Coming Soon"</div> }/>
                    <Route path="/*any" view=|| view! {
                        <div class="not-found">
                            <h1>"404 - Page Not Found"</h1>
                            <p>"The page you're looking for doesn't exist."</p>
                            <a href="/">"Go back home"</a>
                        </div>
                    }/>
                </Routes>
            </main>
        </Router>
    }
}
