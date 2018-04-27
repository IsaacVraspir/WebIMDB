$(window).on("load", () => {
    console.info("Body loaded! Fetching titles...");
    let group = $('.title-item');
    for (let i = 0; i < group.length; i++) {
        let id = group[i].title;
        $.ajax({
            url: "/json/title/" + id,
            success: (xhr) => {
                let year = xhr.start_year;
                if (xhr.end_year) {
                    year += " - " + xhr.end_year
                }
                group[i].children[0].innerText = xhr.primary_title;
                group[i].children[1].innerText = year;
            }
        })
    }
});