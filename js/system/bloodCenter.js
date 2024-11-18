import { backendURL, logout, displayToastMessage } from "../utils/utils.js";

logout();

getDatas();



async function getDatas(stockRequest = {}) {
    const get_bloodCenters = document.getElementById("get_bloodCenters");

    get_bloodCenters.innerHTML = `<div class="placeholder-glow mt-2" role="status">
        <span class="placeholder rounded-3">Loading...</span>
    </div>`;

    const headers = {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
    };

    const organizationResponse = await fetch(backendURL + "/api/mobile/organization", { headers });
    const inventoryResponse = await fetch(backendURL + "/api/mobile/inventory", { headers });
    const profileResponse = await fetch(backendURL + "/api/profile/show", { headers });

    const json_organization = await organizationResponse.json();
    const json_inventory = await inventoryResponse.json();
    const json_profile = await profileResponse.json();

    if (organizationResponse.ok && inventoryResponse.ok && profileResponse.ok) {
        const requestOrg = json_profile.role === "staff"
            ? json_organization.find(org => org.user_id === json_profile.user_id)
            : json_organization.find(org => org.user_id === json_profile.id);

        if (!requestOrg) {
            get_bloodCenters.innerHTML = `<div class="p-4 text-center">No matching organizations found</div>`;
            return;
        }

        const { bloodType, component, urgencyScale, quantity } = stockRequest;

        let bloodCenter = "";
        let hasBloodCenter = false;

        // Loop through inventory and apply filtering logic
        for (const stock of json_inventory) {
            const stockBloodType = stock.blood_type + stock.rh_factor + stock.component;
            const requestedBlood = bloodType + component;

            // Check if the stock matches the requested blood type and component
            if (stockBloodType === requestedBlood && stock.avail_blood_units >= quantity) {
                const org = json_organization.find(org => org.user_id === stock.user_id && org.org_type === "Blood Center");

                if (org) {
                    hasBloodCenter = true;
                    bloodCenter += createBloodCenterCard(org, requestOrg, stockRequest, json_inventory);
                }
            }
        }

        if (!hasBloodCenter) {
            bloodCenter = `<div class="flex-grow-1 p-4 text-center shadow-sm rounded-3">Search by filtering</div>`;
        }

        get_bloodCenters.innerHTML = bloodCenter;

        // Attach event listeners for request buttons
        document.querySelectorAll(".requestButton").forEach(button => {
            button.addEventListener("click", requestClick);
        });
    }
}


function createBloodCenterCard(org, requestOrg,stockRequest, inventory) {
    const { bloodType, component, urgencyScale, quantity } = stockRequest;

    return `
    <div class="row flex-grow-1 border p-3 rounded-3 position-relative mb-2 mx-3">
    <div class="col-11" data-bs-toggle="modal" data-bs-target="#bloodCenterModal_${org.org_id}">
        <div class="">
            <div class="position-absolute pt-2 ps-1">
                <img src="assets/icon/map-marker-home.png" alt="" width="60px" />
            </div>
            <div class="mt-2" style="margin-left: 80px">
                <span class="fw-bold">${org.org_name}</span><br>
                <span class="font-size" id="color">${org.org_email}</span><br />
                <span>${org.address} | ${org.city}, ${org.zipcode} | ${org.country} | <small>${org.operating_hour.toUpperCase()}</small></span>
            </div>
        </div>
    </div>
    <div class="col-2">
        <div class="d-flex" style="position: absolute; right: 20px; bottom: 15px">
            <button type="button" class="updateButton font-size requestButton" style="width: 70px; height: 35px"
                    data-id="${requestOrg.user_id}" data-status="Pending"
                    data-receiverId="${org.user_id}" data-bloodType="${bloodType}"
                    data-component="${component}" data-urgencyScale="${urgencyScale}" data-quantity="${quantity}">
                Request
            </button>
        </div>
    </div>
</div>

<!-- Modal -->
<div class="modal fade" id="bloodCenterModal_${org.org_id}" tabindex="-1" aria-labelledby="bloodCenterModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-body p-4">
                <div class="d-flex justify-content-center">
                    <img src="assets/icon/map-marker-home.png" alt="" width="80px" />
                </div>
                <div class="mt-3 text-center">
                    <span class="fw-bold fs-5">${org.org_name}</span><br>
                    <span class="font-size">${org.org_email}</span><br />
                    <span>${org.address}, ${org.city}, ${org.zipcode}, ${org.country}</span><br />
                    <span>${org.contact_info}</span><br />
                    <span>${org.operating_hour.toUpperCase()}</span>
                </div>
                <p class="font-size mt-3">Description: ${org.description || "No description available."}</p>
                <div class="pt-2">
                    <span class="fw-bold font-size d-flex ms-2">Available stocks</span>
                    <div class="d-flex shadow-sm mt-2 bg-secondary text-white" style="border-radius: 10px">
                        <div class="has-body flex-grow-1">Blood type</div>
                        <div class="has-body flex-grow-1">Component</div>
                        <div class="has-body flex-grow-1">Units</div>
                    </div>
                    ${getAvailStocks(inventory, org.user_id)}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="buttonBack1" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
    // Add event listener to the Request button
    document.addEventListener('DOMContentLoaded', () => {
        const requestButtons = document.querySelectorAll('.requestButton');
        requestButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                console.log('Request button clicked', button.dataset);
            });
        });
    });
</script>
`;
}

function getAvailStocks(inventory, org_id) {
    let stocks = inventory
        .filter(stock => stock.user_id === org_id)
        .map(stock => `
            <div class="d-flex mt-1">
                <div class="has-body flex-grow-1">${stock.blood_type + stock.rh_factor}</div>
                <div class="has-body flex-grow-1">${stock.component}</div>
                <div class="has-body flex-grow-1">${stock.avail_blood_units}</div>
            </div>`)
        .join("");

    return stocks || `<div class="d-flex mt-1"><div class="has-body flex-grow-1">No stocks available</div></div>`;
}

const request_filter_form = document.getElementById("filter_form");
request_filter_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(request_filter_form); 

    const stockRequest = { 
      bloodType: formData.get("blood_type"),
      component: formData.get("component"),
      urgencyScale: formData.get("urgency_scale"),
      quantity: formData.get("quantity"),
    }

    console.log(stockRequest);

    getDatas(stockRequest);
}

function requestClick(e) {
    const data = {
        id: e.target.getAttribute("data-id"),
        status: e.target.getAttribute("data-status"),
        receiverId: e.target.getAttribute("data-receiverId"),
        bloodType: e.target.getAttribute("data-bloodType"),
        component: e.target.getAttribute("data-component"),
        urgencyScale: e.target.getAttribute("data-urgencyScale"),
        quantity: e.target.getAttribute("data-quantity"),
    };
    requestBlood(data);
}

async function requestBlood(data) {
    const requestButton = document.querySelector(".requestButton");
    requestButton.disabled = true;
    requestButton.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
  <span class="visually-hidden" role="status">Loading...</span>`;

    const formData = new FormData();
    formData.append("blood_type", data.bloodType);
    formData.append("component", data.component);
    formData.append("urgency_scale", data.urgencyScale);
    formData.append("quantity", data.quantity);
    formData.append("user_id", data.id);
    formData.append("status", data.status);
    formData.append("receiver_id", data.receiverId);

    const requestResponse = await fetch(backendURL + "/api/bloodrequest", {
        method: "POST",
        headers: { Accept: "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: formData,
    });

    const json_request = await requestResponse.json();
    requestButton.disabled = false;
    requestButton.innerHTML = `Request`;

    if (requestResponse.ok) {
        displayToastMessage("create-success");
    } else {
        displayToastMessage("create-fail");
        console.log(json_request.message);
    }
}


