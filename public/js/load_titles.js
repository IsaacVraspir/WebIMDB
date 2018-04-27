$(window).on("load", () => {
    console.info("Body loaded! Fetching titles...");
    let group = $('.title-item');
    $.each((item) => {
        let id = item.title;
        console.log(id);
        $.ajax({
            url: "/json/title/" + id,
            success: (xhr) => {
                console.log(xhr);
            }
        })
    })
});