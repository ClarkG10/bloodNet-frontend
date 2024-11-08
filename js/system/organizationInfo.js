import { backendURL, checkOrgInfoStatus, userlogged } from "../utils/utils.js";

userlogged();

const form_organization = document.getElementById("form_organization");

form_organization.onsubmit = async (e) => {
    e.preventDefault();

    document.querySelector(".submit").disabled = true;
    document.querySelector(".submit").innerHTML = `<div class="spinner-border" role="status" width="30px"></div>`;

    const formData = new FormData(form_organization);

const organizationResponse = await fetch(backendURL + "/api/organization", {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: formData,
    });
    const json_organization = await organizationResponse.json();


    if (organizationResponse.ok) {
        localStorage.setItem("type", json_organization.org_type);
        form_organization.reset();
        checkOrgInfoStatus();
    } else {
        alert("Duplicate Email Entry.");
        console.log("Validation error:", json_organization.message);
    }
    
    document.querySelector(".submit").disabled = false;
    document.querySelector(".submit").innerHTML = `Submit`;
};





