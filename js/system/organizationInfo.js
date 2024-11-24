import { backendURL, checkOrgInfoStatus, userlogged } from "../utils/utils.js";

userlogged();

const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
};

const form_organization = document.getElementById("form_organization");

form_organization.onsubmit = async (e) => {
    e.preventDefault();

    const submitFormButton = document.querySelector(".submit");
    submitFormButton.disabled = true;
    submitFormButton.innerHTML = `<div class="spinner-border" role="status" width="30px"></div>`;

    const formData = new FormData(form_organization);

const organizationResponse = await fetch(backendURL + "/api/organization", {
        method: "POST", headers, body: formData,
    });
    const json_organization = await organizationResponse.json();

    if (organizationResponse.ok) {
        localStorage.setItem("type", json_organization.org_type);
        form_organization.reset();
        await checkOrgInfoStatus();
    } else {
        alert("Duplicate Email Entry.");
        console.log("Validation error:", json_organization.message);
    }
    submitFormButton.disabled = false;
    submitFormButton.innerHTML = `Submit`;
};





