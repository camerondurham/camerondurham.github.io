use leptos::*;
use leptos_meta::*;
use leptos_router::*;

use crate::components::nav::Nav;
use crate::pages::{home::Home, posts::Posts, projects::Projects, photos::Photos};

#[component]
pub fn App() -> impl IntoView {
    provide_meta_context();

    view! {
        <Html lang="en"/>
        <Meta charset="utf-8"/>
        <Meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <Title text="Cameron Durham"/>

        <Router>
            <Nav/>
            <main class="main-content">
                <Routes>
                    <Route path="/" view=Home/>
                    <Route path="/posts" view=Posts/>
                    <Route path="/projects" view=Projects/>
                    <Route path="/photos" view=Photos/>
                    <Route path="/codecanvas" view=|| view! { <div>"CodeCanvas - Coming Soon"</div> }/>
                </Routes>
            </main>
        </Router>
    }
}
