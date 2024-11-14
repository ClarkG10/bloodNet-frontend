import { backendURL, jsonToCSV, userlogged, logout, displayToastMessage, getPendingRequest } from "../utils/utils.js";

userlogged();
logout();
getPendingRequest();

const get_donor = document.getElementById("get_donors");
const generateReportButton = document.getElementById("generateDonorReport");
const donor_form = document.getElementById("donor_form");

donor_form.onsubmit = async (e) => {
    e.preventDefault();

    const create_donor = document.querySelector(".createButton");
    create_donor.disabled = true;
    create_donor.innerHTML = `<div class="spinner-border" role="status"></div>`;

    const formData = new FormData(donor_form);
    console.log(donor_form)

    const donorResponse = await fetch(backendURL + "/api/donor", {
        method: "POST", 
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: formData,
    });

    const json_donor = await donorResponse.json(); 

    if(donorResponse.ok){
        donor_form.reset();
        displayToastMessage("create-success");
        await getDatas();
    }else{
        displayToastMessage("create-fail");
        console.log(json_donor.message);
    }

    create_donor.disabled = false;
    create_donor.innerHTML = `Create` ;
}

generateReportButton.onclick = async () => {
    const donorResponse = await fetch(backendURL + "/api/donor/all", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        }
    });
  
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

  const blood_compatibility_form = document.getElementById("blood_compatibility_form");
  const getInventory = document.getElementById("inventory"); 
  const getDonor = document.getElementById("donors");
  
      getInventory.innerHTML = `<div class="d-flex mt-1">
          <div class="no-body flex-grow-1 my-2">Search for available stocks</div></div>`
  
      getDonor.innerHTML = `<div class="d-flex mt-1" >
          <div class="no-body flex-grow-1 my-2">Search for compatible donors</div></div>`
  
  
  blood_compatibility_form.onsubmit = async (e) => {
      e.preventDefault();

      const placeholder = `<div class="d-flex shadow-sm">
            <div class="no-body flex-grow-1 my-2"><span class="spinner-border" role="status"></span></div></div>`
  
      getInventory.innerHTML = placeholder;
      getDonor.innerHTML = placeholder;
  
      const formData = new FormData(blood_compatibility_form); 
      const recipient_blood = formData.get("blood_type");
  
      const inventoryResponse = await fetch(backendURL + "/api/inventory/all", {
          headers: {
              Accept: "application/json",
              Authorization: "Bearer " + localStorage.getItem("token"),
          },
      });
  
      const donorResponse = await fetch(backendURL + "/api/donor/all", {
          headers: {
              Accept: "application/json",
              Authorization: "Bearer " + localStorage.getItem("token"),
          },
      });
  
      const json_inventory = await inventoryResponse.json();
      const json_donor = await donorResponse.json();
  
      if (inventoryResponse.ok && donorResponse.ok) {
          let stocks = "";
          let donors = "";
          let hasStocks = false;
          let hasDonor = false;
  
          const isCompatible = (donor_blood, recipient_blood) => {
              const compatibilityChart = {
                  "O-": ["O-"],
                  "O+": ["O-", "O+"],
                  "A-": ["A-", "O-"],
                  "A+": ["A+", "AB+", "O-", "O+"],
                  "B-": ["B-", "O-"],
                  "B+": ["B+", "B-",  "O-", "O+"],
                  "AB-": ["AB-", "B-", "O-", "A-"],
                  "AB+": ["AB+", "AB-", "A-","A+","B+","B-","O-","O+",]
              };
              return compatibilityChart[recipient_blood].includes(donor_blood);
          };
  
          json_inventory.forEach(stock => {
              let blood_type = stock.blood_type.concat(stock.rh_factor);
              if (isCompatible(blood_type, recipient_blood)) {
                  hasStocks = true;
  
                  stocks += `<div class="d-flex mt-1 shadow-sm">
                                <div class="has-body flex-grow-1">${blood_type}</div>
                                <div class="has-body flex-grow-1">${stock.component}</div>
                                <div class="has-body flex-grow-1">${stock.avail_blood_units}</div>
                             </div>`;
              }
          });
  
          if(!hasStocks){
              stocks = `<div class="d-flex mt-1">
            <div class="no-body flex-grow-1 my-2">No Available Stocks</div></div>`
          }
  
          getInventory.innerHTML = stocks;
  
          json_donor.forEach(donor => {
              if (isCompatible(donor.blood_type, recipient_blood)) {
                  hasDonor = true;
  
                  donors += `<div class="d-flex mt-1 shadow-sm">
                                <div class="has-body flex-grow-1">${donor.fullname}</div>
                                <div class="has-body flex-grow-1">${donor.blood_type}</div>
                                <div class="has-body flex-grow-1">${donor.address}</div>
                                <div class="has-body flex-grow-1">${donor.phonenumber}</div>
                                <div class="has-body flex-grow-1"><span class="bg-secondary-subtle py-2 px-4 rounded-4 ${donor.status === "Active" ? "text-success" : "text-danger"}" >${donor.status}</span></div>
                             </div>`;
              }
          });
          if(!hasDonor){
              donors = `<div class="d-flex mt-1">
            <div class="no-body flex-grow-1 my-2">No Compatible Donor</div></div>`
          }
          getDonor.innerHTML = donors;
      }
  };

getDatas();

async function getDatas(url = "", keyword = ""){
    get_donor.innerHTML = `            
        <div class="d-flex has-head shadow-sm">
          ${'<div class="has-body"><span class="spinner-border" role="status"></span></div>'.repeat(7)}
        </div>
    `;
    let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) + "&" : "");

    const donorResponse = await fetch(url || backendURL + "/api/donor" + queryParams, {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const json_donor = await donorResponse.json();

    if(donorResponse.ok){
        let donors = "";
        let hasDonor = false;
        const donorData = json_donor.data;
        console.log(donorData)

        donorData.forEach(donor => {
        hasDonor = true;
        
        donors += `<div class="d-flex has-head shadow-sm">
          <div class="has-body">${donor.fullname}</div>
          <div class="has-body">${donor.blood_type.toUpperCase()}</div>
          <div class="has-body" style="overflow: hidden !important">${donor.address}</div>
          <div class="has-body">${donor.phonenumber}</div>
          <div class="has-body">${donor.email_address}</div>
           <div class="has-body">
                        <span class="bg-secondary-subtle py-1 px-3 rounded-4 ${donor.status === "Active" ? "text-success" : "text-danger"}">${donor.status}</span>
                      </div>
          <div class="has-body">
          
            <div class="d-flex justify-content-center"><button class="updateButton me-1" data-bs-toggle="modal" data-bs-target="#donorModal_${donor.donor_id}">Details</button> <button
                                class="bg-secondary-subtle deleteButton"
                                style="
                                cursor: pointer;
                                padding: 5px !important;
                                border-radius: 5px;
                                border: none !important;
                                padding-left: 12px !important;
                                padding-right: 12px !important;
                                "
                                data-id="${donor.donor_id}"
                            >
                                <img src="assets/icon/trash.png" alt="" width="15px" />
                            </button>
                            </div>
                            </div>
        </div>
        <!-- View Donor Modal -->
          <div class="modal fade" id="donorModal_${donor.donor_id}" tabindex="-1" aria-labelledby="donorModalLabel" aria-hidden="true">
            <div class="modal-dialog ">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="donorModalLabel">Donor's Details</h5>
                  <button type="button" class="btn-close me-1" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body font-size">
                  <span><strong>Donor's Name: </strong>${donor.fullname}</span><br>
                  <span><strong>Blood type: </strong>${donor.blood_type}</span>
                  <span><br /><strong>Date of birth: </strong>${donor.birthday}</span><br />
                  <span class="me-4"><strong>Gender: </strong>${donor.gender}</span><br />
                  <span><strong>Age: </strong>${donor.age}</span><br />
                  <span class="me-4"><strong>Address: </strong>${donor.address}</span><br />
                  <span><strong>Email Address: </strong>${donor.email_address}</span><br />
                  <span><strong>Phone Number: </strong>${donor.phonenumber}</span><br />
                  <span><strong>Medical History: </strong>${donor.medical_history}</span><br />
                  <span><strong>Current Medications: </strong>${donor.current_medications}</span><br />
                  <span class="me-5"><strong>Allergies: </strong>${donor.allergies}</span><br />
                  <span><strong>Previous Donation: </strong>${donor.previous_donation}</span><br />
                  <span><strong>Status: </strong><span class="${donor.status === `Active` ? "text-success bg-secondary-subtle py-2 px-3 rounded-4" : `text-danger bg-secondary-subtle py-2 px-3 rounded-4`}">${donor.status}</span></span><br />
                  <br>
                  <span class="fw-bold" style="font-size: 19px; color: #b43929;">Emergency Contact</span><br>
                  <span><strong>Name: </strong>${donor.emergency_name}</span><br />
                  <span><strong>Relationship: </strong>${donor.emergency_relationship}</span><br />
                  <span><strong>Phone Number: </strong>${donor.emergency_phonenumber}</span><br />
                </div>
                <div class="modal-footer">
                  <button type="button" class="buttonBack1 me-1" data-bs-dismiss="modal" aria-label="Close">Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- View Donor Modal -->`
        });
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
    
        document.getElementById("pages").innerHTML = pagination;
    
        document.querySelectorAll("#pages .page-link").forEach((link) => {
            link.addEventListener("click", pageAction);
        });
    }
}

const request_search_form = document.getElementById("search_form");
request_search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(request_search_form); 
    const keyword = formData.get("keyword");
    console.log( keyword);

    getDatas("", keyword);
}

const pageAction = async (e) => {
    e.preventDefault();
    const url = e.target.getAttribute("data-url");
    await getDatas(url, "");
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

