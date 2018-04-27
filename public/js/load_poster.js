$(window).on("load", () => {
    console.info("Body loaded! Fetching posters...");

    let titlePosters = $('.title-poster');
    for (let i = 0; i < titlePosters.length; i++) {
        let id = titlePosters[i].title;
        $.ajax({
            url: "/image/title/" + id,
            success: (xhr) => {
                titlePosters[i].src = "https://" + xhr.host + xhr.path;
            }
        })
    }

    let personPosters = $('.person-poster');
    for (let i = 0; i < personPosters.length; i++) {
        let id = personPosters[i].title;
        $.ajax({
            url: "/image/person/" + id,
            success: (xhr) => {
                personPosters[i].src = "https://" + xhr.host + xhr.path;
            },
            failure: (xhr) => {

            }
        })
    }
});