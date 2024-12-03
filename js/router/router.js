const orgType = localStorage.getItem("type");
const token = localStorage.getItem("token");

function setRouter() {
    const currentPath = window.location.pathname;

    switch (currentPath) {
        case `/`:
        case `/index.html`:
        case `/register.html`:
            if (orgType === null && token !== null) {
                window.location.pathname = `/organizationInfo.html`;
            } else if (orgType === "Hospital") {
                window.location.pathname = `/dashboardH.html`;
            } else if (orgType === "Blood Center") {
                window.location.pathname = `/dashboard.html`;
            }
            break;

        case `/organizationInfo.html`:
            if (token === null) {
                window.location.pathname = `/index.html`;
            }
            break;

        case `/dashboard.html`:
        case `/event.html`:
        case `/request.html`:
        case `/donor.html`:
            if (token === null) {
                window.location.pathname = `/index.html`;
            } else if (orgType === "Hospital") {
                window.location.pathname = `/dashboardH.html`;
            }
            break;

        case `/dashboardH.html`:
        case `/bloodCenter.html`:
        case `/bloodRequest.html`:
        case `/compatibilityChecker.html`:
            if (token === null) {
                window.location.pathname = `/index.html`;
            } else if (orgType === "Blood Center") {
                window.location.pathname = `/dashboard.html`;
            }
            break;

        case `/inventory.html`:
        case `/user.html`:
        case `/profile.html`:
        case `/reserveBlood.html`:
            if (token === null) {
                window.location.pathname = `/index.html`;
            }
            break;

        default:
            break;
    }
}

export { setRouter };
