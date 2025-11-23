use leptos::*;

#[component]
pub fn Home() -> impl IntoView {
    view! {
        <div class="container">
            <section class="about">
                <h1>"About"</h1>
                <p>
                    "I'm an SDE II at Amazon, working on catalog indexing for the third-party seller listing platform. "
                    "I contributed to the "
                    <a href="https://www.aboutamazon.com/news/retail/affordable-products-amazon-20-dollars-and-under" target="_blank">
                        "Amazon Haul"
                    </a>
                    " listing experience and work with streaming data processing for distributed search indexing. "
                    "I also contribute to "
                    <a href="https://github.com/camerondurham/open-source-contributions" target="_blank">
                        "open-source projects"
                    </a>
                    " I use."
                </p>
                <p>
                    "Previously, I was a lead course producer for "
                    <a href="https://bytes.usc.edu/cs104/" target="_blank">
                        "USC's CS104 class"
                    </a>
                    ", developing "
                    <a href="https://github.com/csci104/docker" target="_blank">
                        "containerized tools"
                    </a>
                    " for the class environment. I interned at Tesla, where I worked on containerized infotainment UIs "
                    "for all Tesla car models. Before Tesla, I had internships at Amazon and Oracle."
                </p>
            </section>
        </div>
    }
}
