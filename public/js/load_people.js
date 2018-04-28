$(window).on("load", () => {
    console.info("Body loaded! Fetching people...");
    let group = $('.person-item');
    for (let i = 0; i < group.length; i++) {
        let id = group[i].name;
        $.ajax({
            url: "/json/person/" + id,
            success: (xhr) => {
                let year = xhr.birth_year;
                if (xhr.death_year) {
                    year += " - " + xhr.death_year
                }
                group[i].children[0].innerText = xhr.primary_name;
                group[i].children[1].innerText = year;
            },
            error: (xhr) => {
                group[i].children[0].innerText = "";
                group[i].children[1].innerText = "Person not found";
            }
        })
    }
});