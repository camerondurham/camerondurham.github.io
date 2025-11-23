use leptos::*;
use crate::data::get_photos;

#[component]
pub fn Photos() -> impl IntoView {
    let photos = get_photos();

    view! {
        <div class="container">
            <h1>"Photos"</h1>
            <p class="photos-intro">"A collection of photography work and visual explorations."</p>
            <div class="photos-grid">
                {photos.into_iter().map(|photo| {
                    view! {
                        <a href={photo.link_to.clone()} target="_blank" rel="noopener noreferrer" class="photo-card">
                            <div class="photo-image-container">
                                <img src={photo.image_url} alt={photo.title.clone()} loading="lazy"/>
                            </div>
                            <div class="photo-info">
                                <h3>{photo.title}</h3>
                                <p>{photo.description}</p>
                            </div>
                        </a>
                    }
                }).collect::<Vec<_>>()}
            </div>
        </div>
    }
}
