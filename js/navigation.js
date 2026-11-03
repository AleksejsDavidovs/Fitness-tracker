export function initNavigation() {
    const menuButtons = document.querySelectorAll(".menu-button");
    const pages = document.querySelectorAll(".page");

    for (const button of menuButtons) {
        button.addEventListener("click", function () {
            const pageId = button.dataset.page;

            for (const page of pages) {
                page.classList.add("hidden");
            }

            for (const menuButton of menuButtons) {
                menuButton.classList.remove("active");
            }

            document.getElementById(pageId).classList.remove("hidden");
            button.classList.add("active");
        });
    }
}