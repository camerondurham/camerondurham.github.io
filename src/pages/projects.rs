use leptos::*;
use crate::data::get_projects;

#[component]
pub fn Projects() -> impl IntoView {
    let mut projects = get_projects();
    projects.sort_by_key(|p| p.weight);

    view! {
        <div class="container">
            <h1>"Projects"</h1>
            <div class="projects-list">
                {projects.into_iter().map(|project| {
                    view! {
                        <article class="project-item">
                            {if let Some(link) = project.link_to {
                                view! {
                                    <h2>
                                        <a href={link} target="_blank" rel="noopener noreferrer">
                                            {project.title}
                                        </a>
                                    </h2>
                                }.into_view()
                            } else {
                                view! {
                                    <h2>{project.title}</h2>
                                }.into_view()
                            }}
                            <time datetime={project.date.clone()}>{project.date}</time>
                            <p>{project.description}</p>
                        </article>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
