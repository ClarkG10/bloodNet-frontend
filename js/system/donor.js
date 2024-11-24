import {
    backendURL,
    jsonToCSV,
    userlogged,
    logout,
    displayToastMessage,
    getPendingRequest
} from "../utils/utils.js";

userlogged();
logout();
getPendingRequest();

const get_donor = document.getElementById("get_donors");
const generateReportButton = document.getElementById("generateDonorReport");
const donor_form = document.getElementById("donor_form");

const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  };

get_donor.innerHTML = `
<div class="d-flex has-head shadow-sm">
  ${'<div class="has-body"><span class="spinner-border" role="status"></span></div>'.repeat(7)}
</div>
`;

donor_form.onsubmit = async (e) => {
    e.preventDefault();

    const create_donor = document.querySelector(".createButton");
    create_donor.disabled = true;
    create_donor.innerHTML = `<div class="spinner-border" role="status"></div>`;

    const formData = new FormData(donor_form);

    const donorResponse = await fetch(backendURL + "/api/donor", {
        method: "POST", headers, body: formData,
    });

    const json_donor = await donorResponse.json();

    if (donorResponse.ok) {
        donor_form.reset();
        displayToastMessage("create-success");
        await getDatas();
    } else {
        displayToastMessage("create-fail");
        console.log(json_donor.message);
    }
    create_donor.disabled = false;
    create_donor.innerHTML = `Create`;
};

async function addNewDonation(id) {
    const donation_form = document.getElementById("add_donation_form_" + id);

    donation_form.onsubmit = async (e) => {
        e.preventDefault();

        const closeButton = document.getElementById("closeButton_" + id);
        const create_donation = document.querySelector(".create_" + id);
        create_donation.disabled = true;
        create_donation.innerHTML = `<div class="spinner-border" role="status"></div>`;

        const formData = new FormData(donation_form);

        const donationResponse = await fetch(backendURL + "/api/donationhistory", {
            method: "POST", headers, body: formData,
        });

        if (donationResponse.ok) {
            const inventoryResponse = await fetch(backendURL + "/api/inventory/all", { headers });

            if (inventoryResponse.ok) {
                const inventoryData = await inventoryResponse.json();
                const donorBloodType = formData.get("blood_type") + formData.get("component");
                let stockUpdated = false;

                for (const stock of inventoryData) {
                    const stockBloodType = stock.blood_type + stock.rh_factor + stock.component;

                    if (stockBloodType === donorBloodType) {
                        stockUpdated = true;
                        const units = parseInt(formData.get("units"));
                        const inventoryId = stock.inventory_id;

                        const updateResponse = await updateInventoryStock(inventoryId, units);
                        if (updateResponse.ok) {
                            displayToastMessage("update-success");
                            await logStockIn(stock, units);
                            closeButton.click();
                        } else {
                            displayToastMessage("update-fail");
                        }
                        break;
                    }
                }

                if (!stockUpdated) {
                    const createStockResponse = await createNewStock(formData);
                    if (createStockResponse.ok) {
                        displayToastMessage("create-success");
                        const newStockData = await createStockResponse.json();
                        const stock = {
                            blood_type: formData.get("blood_type").split(/(?=[+-])/)[0],
                            rh_factor: formData.get("blood_type").split(/(?=[+-])/)[1],
                            component: formData.get("component"),
                            inventory_id: newStockData.inventory_id,
                            user_id: formData.get("user_id"),
                        };
                        const units = parseInt(formData.get("units"));
                        await logStockIn(stock, units);
                        closeButton.click();
                    } else {
                        displayToastMessage("create-fail");
                    }
                }
                donation_form.reset();
                await getDatas();
            }
        } else {
            console.log("Failed to add donation history");
        }
        create_donation.disabled = false;
        create_donation.innerHTML = "Submit";
    };
}

async function updateInventoryStock(inventoryId, units) {
    const inventoryResponse = await fetch(backendURL + "/api/inventory/" + inventoryId, { headers});

    if (inventoryResponse.ok) {
        const prevData = await inventoryResponse.json();
        const formData = new FormData();
        formData.append("avail_blood_units", units + parseInt(prevData.avail_blood_units));
        formData.append("_method", "PUT");

        return fetch(backendURL + "/api/inventory/bloodunits/" + inventoryId, {
            method: "POST", headers, body: formData,
        });
    }
    return inventoryResponse;
}

async function logStockIn(stock, units) {
    const stockData = new FormData();
    stockData.append("blood_type", stock.blood_type);
    stockData.append("rh_factor", stock.rh_factor);
    stockData.append("component", stock.component);
    stockData.append("inventory_id", stock.inventory_id);
    stockData.append("reserveBlood_id", 0);
    stockData.append("user_id", stock.user_id);
    stockData.append("units_in", units);

    return fetch(backendURL + "/api/stockIn", {
        method: "POST", headers, body: stockData,
    });
}

async function createNewStock(formData) {
    const [bloodType, rhFactor] = formData.get("blood_type").split(/(?=[+-])/);

    const newStockData = new FormData();
    newStockData.append("blood_type", bloodType);
    newStockData.append("rh_factor", rhFactor);
    newStockData.append("component", formData.get("component"));
    newStockData.append("avail_blood_units", formData.get("units"));
    newStockData.append("user_id", formData.get("user_id"));

    return fetch(backendURL + "/api/inventory", {
        method: "POST", headers, body: newStockData,
    });
}

function addDonationClick(event) {
    const donor_id = event.currentTarget.getAttribute('data-id');
    console.log(donor_id);
    addNewDonation(donor_id);
}

generateReportButton.onclick = async () => {
    const donorResponse = await fetch(backendURL + "/api/donor/all", { headers });
  
    const json_donor = await donorResponse.json();
    console.log(json_donor)
    if (donorResponse.ok) {
        const csvData = jsonToCSV(json_donor);
        downloadCSV(csvData, 'donor_list_report.csv');
    }
  };
  
  function downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

getDatas();

async function getDatas(url = "", keyword = ""){
    let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) + "&" : "");

    const donorResponse = await fetch(url || backendURL + "/api/donor" + queryParams, { headers });
    const donationHistoryResponse = await fetch(backendURL + "/api/donationhistory", { headers });

    if(!donationHistoryResponse.ok || !donorResponse.ok){
        throw new Error("Error: " + donationHistoryResponse.status || donorResponse.status);
    }

    const json_donationHistory = await donationHistoryResponse.json();
    const json_donor = await donorResponse.json();

    if(donorResponse.ok){
        let donors = "";
        let hasDonor = false;
        const donorData = json_donor.data;
        console.log(donorData)

        for(const donor of donorData) {
        hasDonor = true;

        donors += `
        <div class="d-flex has-head shadow-sm">
            <div class="has-body">${donor.fullname}</div>
            <div class="has-body">${donor.blood_type.toUpperCase()}</div>
            <div class="has-body" style="overflow: hidden !important">${donor.address}</div>
            <div class="has-body">${donor.phonenumber}</div>
            <div class="has-body">${donor.email_address}</div>
            <div class="has-body">
                <span class="bg-secondary-subtle py-1 px-3 rounded-4 ${donor.status === "Active" ? "text-success" : "text-danger"}">${donor.status}</span>
            </div>
            <div class="has-body">
                <div class="d-flex justify-content-center">
                    <button class="updateButton me-1" data-bs-toggle="modal" data-bs-target="#donorModal_${donor.donor_id}">Details</button>
                    <button class="bg-secondary-subtle deleteButton" style="cursor: pointer; padding: 5px !important; border-radius: 5px; border: none !important; padding-left: 12px !important; padding-right: 12px !important;" data-id="${donor.donor_id}">
                        <img src="assets/icon/trash.png" alt="" width="15px" />
                    </button>
                </div>
            </div>
        </div>
        
        <div class="modal fade" id="donorModal_${donor.donor_id}" tabindex="-1" aria-labelledby="donorModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="donorModalLabel">Donor's Details</h5>
                        <button type="button" class="btn" id="closeButton_${donor.donor_id}" data-bs-dismiss="modal">X</button>
                    </div>
                    <div class="modal-body font-size">
                        <div class="d-flex justify-content-end">
                            <button class="updateButton position-absolute" type="button" data-bs-toggle="collapse" data-bs-target="#addNewDonation_${donor.donor_id}">Add New Donation</button>
                        </div>
                        <div class="collapse mt-5" id="addNewDonation_${donor.donor_id}">
                            <div class="card card-body">
                                <form id="add_donation_form_${donor.donor_id}">
                                    <input type="hidden" name="donor_id" value="${donor.donor_id}" />
                                    <input type="hidden" name="user_id" value="${donor.user_id}" />
                                    <input type="hidden" name="blood_type" value="${donor.blood_type}" />
                                    <div class="form-floating mb-3">
                                        <input type="number" class="form-control" id="units" placeholder="Units" name="units">
                                        <label for="units">Units</label>
                                    </div>
                                    <div class="form-floating mb-3">
                                        <select class="form-select form-control" id="component" name="component" required>
                                            <option selected disabled>Select types of Component</option>
                                            <option value="Whole Blood">Whole Blood</option>
                                            <option value="Red Blood Cells">Red Blood Cells</option>
                                            <option value="White Blood Cells">White Blood Cells</option>
                                            <option value="Platelets">Platelets</option>
                                            <option value="Plasma">Plasma</option>
                                            <option value="Cryoprecipitate">Cryoprecipitate</option>
                                            <option value="Granulocytes">Granulocytes</option>
                                        </select>
                                        <label for="component">Types of Components</label>
                                    </div>
                                    <div class="form-floating mb-3">
                                        <input type="date" class="form-control" id="donation_date" placeholder="Date of Donation" name="donation_date">
                                        <label for="donation_date">Date of Donation</label>
                                    </div>
                                    <div class="d-flex">
                                        <button type="submit" class="updateButton w-100 create_${donor.donor_id} addDonation" data-id="${donor.donor_id}">Submit</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <span><strong>Donor's Name: </strong>${donor.fullname}</span><br>
                        <span><strong>Blood type: </strong>${donor.blood_type}</span><br>
                        <span><strong>Date of birth: </strong>${donor.birthday}</span><br>
                        <span><strong>Gender: </strong>${donor.gender}</span><br>
                        <span><strong>Age: </strong>${donor.age}</span><br>
                        <span><strong>Address: </strong>${donor.address}</span><br>
                        <span><strong>Email Address: </strong>${donor.email_address}</span><br>
                        <span><strong>Phone Number: </strong>${donor.phonenumber}</span><br>
                        <span><strong>Medical History: </strong>${donor.medical_history}</span><br>
                        <span><strong>Current Medications: </strong>${donor.current_medications}</span><br>
                        <span><strong>Allergies: </strong>${donor.allergies}</span><br>
                        <span><strong>Previous Donation: </strong>${donor.previous_donation}</span><br>
                        <span><strong>Status: </strong><span class="${donor.status === 'Active' ? "text-success bg-secondary-subtle py-2 px-3 rounded-4" : "text-danger bg-secondary-subtle py-2 px-3 rounded-4"}">${donor.status}</span></span><br>
                        <br>
                        <span class="fw-bold" style="font-size: 18px; color: #b43929;">Emergency Contact</span><br>
                        <span><strong>Name: </strong>${donor.emergency_name}</span><br>
                        <span><strong>Relationship: </strong>${donor.emergency_relationship}</span><br>
                        <span><strong>Phone Number: </strong>${donor.emergency_phonenumber}</span><br>
                        <br>
                        <span class="fw-bold" style="font-size: 18px; color: #b43929;">Donation History</span><br>
                        <div class="row mb-3 mt-1">
                            <div class="col-md-3"><span class="opacity-50 fw-bold">Units</span></div>
                            <div class="col-md-5"><span class="fw-bold opacity-50">Component</span></div>
                            <div class="col-md-4 mb-1"><span class="fw-bold opacity-50">Date</span></div>
                            ${getDonationHistory(donor.donor_id, json_donationHistory)}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        };
        if(!hasDonor){
            donors = `<div class="d-flex shadow-sm">
          <div class="no-body"></div>
          <div class="no-body"></div>
          <div class="no-body"></div>
          <div class="no-body mt-3 mb-3">No Donor</div>
          <div class="no-body"></div>
          <div class="no-body"></div>
          <div class="no-body"></div>
        </div>`;
        }

        get_donor.innerHTML = donors;

        let pagination = "";

        if (json_donor.links) {
            json_donor.links.forEach((link) => {
                pagination += `
                    <li class="page-item" >
                        <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}" style="color: #b43929">
                            ${link.label}
                        </a>
                    </li>`;
            });
        }

        document.querySelectorAll(".deleteButton").forEach(button => {
            button.addEventListener("click", deleteClick);
        });

        document.querySelectorAll(".addDonation").forEach(button => {
            button.addEventListener("click", addDonationClick);
        });
    
        document.getElementById("pages").innerHTML = pagination;
    
        document.querySelectorAll("#pages .page-link").forEach((link) => {
            link.addEventListener("click", pageAction);
        });
    }
}


function getDonationHistory(donorId, json_donationHistory){
    let donationHistory = "";
    let hasDonationHistory = false;
    json_donationHistory.forEach((donation) => {
        if(donorId === donation.donor_id){
         hasDonationHistory = true;
         donationHistory += `
                <div class="col-md-3">${donation.units}</div>
                <div class="col-md-5">${donation.component}</div>
                <div class="col-md-4">${donation.donation_date}</div>`;
        }
    });

    if(!hasDonationHistory){
        donationHistory = `<div class="row mt-3">
            <div class="col-md-12 text-center">No Donation History</div>
        </div>`;
    }
    return donationHistory;
}

const request_search_form = document.getElementById("search_form");
request_search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(request_search_form); 
    const keyword = formData.get("keyword");
    console.log( keyword);

    getDatas("", keyword);
}

async function deleteDonor(id) {
    if (confirm("Are you sure you want to delete this item?")) {
        const donorResponse = await fetch(backendURL + "/api/donor/" + id, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
        });

        const json_donor = await donorResponse.json();

        if (donorResponse.ok) {
            displayToastMessage("delete-success");
            await getDatas();
        } else {
            displayToastMessage("delete-fail");
            console.error("Delete failed:", json_donor.message);
        }
    }
}

function deleteClick(event) {
    const donor_id = event.currentTarget.getAttribute('data-id');
    console.log(donor_id);
    deleteDonor(donor_id);
}

const pageAction = async (e) => {
    e.preventDefault();
    const url = e.target.getAttribute("data-url");
    await getDatas(url, "");
}


