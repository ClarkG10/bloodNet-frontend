import { backendURL, logout, displayToastMessage, setRoleAndPermission, getPendingRequest} from "../utils/utils.js";

setRoleAndPermission();
logout();
getPendingRequest(); 

const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
};

const org = document.getElementById("orgProfile");
    
const placeholders = `
    <div class="placeholder-glow mt-2" role="status">
        <span class="placeholder rounded-3">Loading...</span>
    </div>`;

org.innerHTML = `
    <div class="placeholder-glow">
        <img class="border rounded-3 placeholder" width="120px" height="120px" />
    </div>
    <div class="position-absolute" style="top: 75px; left: 155px">
        <span class="fw-bold fs-5">${placeholders}</span><br />
    </div>
    <div>
        <h6 class="fw-bold mt-4">Organization Type</h6>
        <span>${placeholders}</span>
        <h6 class="fw-bold mt-3">Description</h6>
        <span>${placeholders}</span>
        <div class="flex-grow-1">
            <h6 class="fw-bold mt-3">Address</h6>
            <span>${placeholders}</span>
        </div>
        <div class="d-flex">
            <div class="flex-grow-1">
                <h6 class="fw-bold mt-3">Country</h6>
                <span>${placeholders}</span>
            </div>
            <div class="flex-grow-1">
                <h6 class="fw-bold mt-3">City</h6>
                <span>${placeholders}</span>
            </div>
            <div class="flex-grow-1">
                <h6 class="fw-bold mt-3">Zipcode</h6>
                <span>${placeholders}</span>
            </div>
        </div>
        <div class="flex-grow-1">
            <h6 class="fw-bold mt-3">Operating Hours</h6>
            <span>${placeholders}</span>
        </div>
        <div class="flex-grow-1">
            <h6 class="fw-bold mt-3">Contact Information</h6>
            <span>${placeholders}</span>
        </div>
    </div>`;

async function getDatas() {
        const [organizationResponse, profileResponse] = await Promise.all([
            fetch(backendURL + "/api/mobile/organization", { headers }),
            fetch(backendURL + "/api/profile/show", { headers }),
        ]);

        const json_organization = await organizationResponse.json();
        const json_profile = await profileResponse.json();

        if (organizationResponse.ok) {
            let orgProfile = "";

            json_organization.forEach(org => {
                if (org.user_id === json_profile.user_id || org.user_id === json_profile.id) {
                    orgProfile = createProfileHTML(org, json_profile);
                }
            });
            org.innerHTML = orgProfile;

            document.querySelectorAll("#updateOrgButton").forEach(button => {
            button.addEventListener("click", updateClickInfo);
            });
        }
}

getDatas();

function createProfileHTML(org, json_profile) {
    return  `
    <div>
        <img class="border rounded-3" src="${org.image === null ? `assets/imgs/whitelogo.png` : `${backendURL}/storage/${org.image}`}" alt="" width="120px" height="120px" />
    </div>
    <div class="position-absolute" style="top: 75px; left: 155px">
        <span class="fw-bold fs-5">${org.org_name}</span><br />
        <small id="color">${org.org_email}</small>
    </div>
    ${json_profile.role == "admin" ? `<div class="position-absolute d-flex align-items-center justify-content-center" style="top: 80px; right: 50px">
        <button class="updateButton pt-2 text-white px-4 font-size" data-bs-toggle="modal" data-bs-target="#orgUpdateModal_${org.org_id}" data-id="${org.org_id}">Edit</button>
    </div>`: ""}
    <div>
        <h6 class="fw-bold mt-4">Organization Type</h6>
        <span>${org.org_type}</span>
        <h6 class="fw-bold mt-3">Description</h6>
        <span>${org.description}</span>
        <div class="flex-grow-1">
            <h6 class="fw-bold mt-3">Address</h6>
            <span>${org.address}</span>
        </div>
        <div class="d-flex">
            <div class="flex-grow-1">
                <h6 class="fw-bold mt-3">Country</h6>
                <span>${org.country}</span>
            </div>
            <div class="flex-grow-1">
                <h6 class="fw-bold mt-3">City</h6>
                <span>${org.city}</span>
            </div>
            <div class="flex-grow-1">
                <h6 class="fw-bold mt-3">Zipcode</h6>
                <span>${org.zipcode}</span>
            </div>
        </div>
        <div class="flex-grow-1">
            <h6 class="fw-bold mt-3">Operating Hours</h6>
            <span>${org.operating_hour}</span>
        </div>
        <div class="flex-grow-1">
            <h6 class="fw-bold mt-3">Contact Information</h6>
            <span>${org.contact_info}</span>
        </div>
    </div>
    <div class="modal fade" id="orgUpdateModal_${org.org_id}" tabindex="-1" aria-labelledby="orgUpdateModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold fs-4" id="orgUpdateModalLabel">Edit Information</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="org_form_${org.org_id}">               
                        <div class="d-flex gap-2 mt-2">
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="text" class="form-control" id="org_name" name="org_name" value="${org.org_name}" />
                                <label for="org_name">Organization Name</label>
                            </div>
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="text" class="form-control" id="org_email" name="org_email" value="${org.org_email}" />
                                <label for="org_email">Organization Email</label>
                            </div>
                        </div>
                        <div class="d-flex gap-1">
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="text" class="form-control" id="address" name="address" value="${org.address}" />
                                <label for="address">Address</label>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="text" class="form-control" id="country" name="country" value="${org.country}" />
                                <label for="country">Country</label>
                            </div>
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="text" class="form-control" id="city" name="city" value="${org.city}" />
                                <label for="city">City</label>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="number" class="form-control" id="zipcode" name="zipcode" value="${org.zipcode}" />
                                <label for="zipcode">Zipcode</label>
                            </div>
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="text" class="form-control" id="operating_hour" name="operating_hour" value="${org.operating_hour}" />
                                <label for="operating_hour">Operating Hours</label>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="text" class="form-control" id="description" name="description" value="${org.description}" />
                                <label for="description">Description</label>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="text" class="form-control" id="contact_info" name="contact_info" value="${org.contact_info}" />
                                <label for="contact_info">Contact Information</label>
                            </div>
                        </div>
                         <div class="d-flex gap-1">
                            <div class="form-floating mb-3 flex-grow-1">
                                <input type="file" class="form-control" id="image" name="image" accept=".png, .jpg, .jpeg" value="${org.image}" />
                                <label for="address">Logo</label>
                            </div>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-end">
                          <button
                            type="submit"
                            class="button1 updateOrgButton me-2 d-flex justify-content-center align-items-center" 
                            id="updateOrgButton"
                            data-id="${org.org_id}"
                            style="font-size: 16px"
                          >
                            Done
                          </button>
                          <button
                            type="button"
                            class="buttonBack modal_close"
                            data-bs-dismiss="modal"
                            style="font-size: 16px"
                          >
                            Cancel
                          </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>`
}

function updateClickInfo(e) {
    const org_id = e.target.getAttribute("data-id");
    console.log(org_id)
    updateOrgInfo(org_id);
  }

async function updateOrgInfo(id) {
    const update_form = document.getElementById("org_form_" + id);

    if (!update_form) return;

    update_form.onsubmit = async (e) => {
        e.preventDefault();
        const updateButton = document.querySelector("#updateOrgButton");
        updateButton.innerHTML = `<div class="spinner-border" role="status"></div>`;
        updateButton.disabled = true;

        const formData = new FormData(update_form);
        formData.append("_method", "PUT");

        const organizationResponseAll = await fetch(backendURL + "/api/organization/" + id, {
            method: "POST", headers, body: formData,
        });
        const json_organization = await organizationResponseAll.json();

        if (organizationResponseAll.ok) {
            displayToastMessage("update-success");
            document.querySelector(`#orgUpdateModal_${id} .buttonBack`).click();
            await getDatas();
        } else {
            displayToastMessage("update-fail");
            console.error("Update failed:", json_organization.message);
        }
        updateButton.disabled = false;
        updateButton.innerHTML = 'Done';
    }
}
