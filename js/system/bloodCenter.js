import { backendURL, logout, displayToastMessage} from "../utils/utils.js";

logout();

getDatas();
async function getDatas() {
    const get_bloodCenters = document.getElementById("get_bloodCenters");

    get_bloodCenters.innerHTML = `<div class="placeholder-glow mt-2" role="status">
            <span class="placeholder rounded-3">Loading...</span>
            </div>`

    const organizationResponse  = await fetch(backendURL + "/api/mobile/organization", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const inventoryResponse  = await fetch(backendURL + "/api/mobile/inventory", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const profileResponse  = await fetch(backendURL + "/api/profile/show", {
      headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
      },
  });

    const json_organization = await organizationResponse.json();
    const json_inventory = await inventoryResponse.json();
    const json_profile = await profileResponse.json();

    const requestOrg = json_profile.role === "staff" ? json_organization.find(org => org.user_id === json_profile.user_id) : json_organization.find(org => org.user_id === json_profile.id);

    if(organizationResponse.ok && inventoryResponse.ok && profileResponse.ok){
        let bloodCenter = "";
        let index = 0;
        let hasBloodCenter = false;

        json_organization.forEach(org => {
            if(org.org_type == "Blood Center"){
            hasBloodCenter = true;
            bloodCenter += `<div
            class="flex-grow-1 border p-3 rounded-3 position-relative mb-2 mx-3"
            data-bs-toggle="modal"
            data-bs-target="#bloodCenterModal_${org.org_id}"
            style="
              box-shadow: rgba(0, 0, 0, 0.25) 0px 0.0625em 0.0625em,
                rgba(0, 0, 0, 0.25) 0px 0.125em 0.5em,
                rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset;
            "
          >
            <div class="position-absolute pt-2 ps-1">
              <img src="assets/icon/map-marker-home.png" alt="" width="60px" />
            </div>
            <div class="mt-2" style="margin-left: 80px">
              <span class="fw-bold">
                ${org.org_name}</span
              ><br>
              <span class="font-size" id="color">${org.org_email}</span><br /><span>${org.address} | <span>${org.city}, ${org.zipcode}</span
              > | ${org. country} | <small>${org.operating_hour.toUpperCase()}</small>
            </div>
              
            <div style="position: absolute; right: 20px; bottom: 15px">
             <button type="button" class="updateButton font-size"
              data-bs-toggle="modal"
            data-bs-target="#requestModal_${org.org_id}"
            >
                Request
              </button>
              </div>
          </div>
    
    <!-- Organization Modal -->
    <div
      class="modal fade"
      id="bloodCenterModal_${org.org_id}"
      tabindex="-1"
      aria-labelledby="bloodCenterModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-body position-relative p-4 pt-4">
            <div class="d-flex justify-content-center">
              <img src="assets/icon/map-marker-home.png" alt="" width="80px" />
            </div>
            <div class="mt-3 mb-3 text-center">
              <span class="fw-bold fs-5">
                ${org.org_name}</span>
              </span><br>
              <span class="font-size" id="color">${org.org_email}</span><br /><span>${org.address} | <span>${org.city}, ${org.zipcode}</span
              > | ${org. country}<br /><span>${org.contact_info}</span><br />
              <span>${org.operating_hour.toUpperCase()}</span>
            </div>
            <br />
            <p class="font-size">
              Description: <br />
              ${org.description}.
            </p>
            <div class="pt-2">
              <div class="d-flex">
                <span class="fw-bold font-size d-flex ms-2">
                  Available stocks</span
                >
              </div>
              <div
                class="d-flex shadow-sm mt-2 bg-secondary"
                style="font-weight: bold; color: white; border-radius: 10px"
              >
                <div class="has-body flex-grow-1">Blood type</div>
                <div class="has-body flex-grow-1">Component</div>
                <div class="has-body flex-grow-1">Units</div>
              </div>
              ${getAvailStocks(json_inventory, org.user_id)}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="buttonBack1" data-bs-dismiss="modal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Organization Modal -->
    
    <!-- Request Modal -->
    <div
      class="modal fade"
      id="requestModal_${org.org_id}"
      tabindex="-1"
      aria-labelledby="requestModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
          <div><span class="fw-bold">Request to: </span><br><span class="font-size">${org.org_name}</span></div>
          </div>
          <div class="modal-body p-2">
            <form id="request_form_${org.org_id}">
            <div class="text-center font-size fw-bold mt-1">Request Form</div>
              <input type="hidden" value="Pending" name="status" />
              <input type="hidden" value="${org.user_id}" name="receiver_id" />
              <input type="hidden" value="${requestOrg.user_id}" name="user_id"/>

              <div class="form-floating mb-3 mt-3">
                <select
                  class="form-select form-control"
                  id="bloodTypes"
                  name="blood_type"
                  required
                >
                  <option selected disabled>Select types of Blood</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                </select>
                <label for="blood_type">Types of Blood</label>
              </div>
              <div class="form-floating mb-3">
                <select
                  class="form-select form-control"
                  id="component"
                  name="component"
                  required
                >
                  <option selected disabled>Select types of Component</option>
                  <option value="Whole Blood">Whole Blood</option>
                  <option value="Red Blood Cells">Red Blood Cells</option>
                  <option value="White Blood Cells">White Blood Cells</option>
                  <option value="Platelets">Platelets</option>
                  <option value="Plasma">Plasma</option>
                  <option value="Cryoprecipitate">Cryoprecipitate</option>
                  <option value="Granulocytes">Granulocytes</option>
                </select>
                <label for="rhFactor">Types of Components</label>
              </div>
              <div class="form-floating mb-3">
                <select
                  class="form-select form-control"
                  id="urgency_scale"
                  name="urgency_scale"
                  required
                >
                  <option selected disabled>Select Urgency Scale</option>
                  <option value="Routine">Routine</option>
                  <option value="Non-urgent">Non-urgent</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Critical">Critical</option>
                </select>
                <label for="urgency_scale">Urgency Scale</label></label>
              </div>
              <div class="form-floating mb-3">
                <input
                  type="number"
                  class="form-control"
                  id="quantity"
                  name="quantity"
                  placeholder="Units"
                  required
                />
                <label for="quantity">Units</label>
              </div>
              <hr />
              <div class="d-flex align-items-end justify-content-end">
                <button
                  type="submit"
                  class="button1 me-2 add lign-items-center requestButton justify-content-center"
                  style="font-size: 16px"
                  data-id="${org.org_id}"
                >
                  Request
                </button>
                <button
                  type="button"
                  class="buttonBack modal_close"
                  data-bs-dismiss="modal"
                  style="font-size: 16px"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>`
    index++;
  }
});

    if(!hasBloodCenter){
      bloodCenter = `<div class="flex-grow-1 p-4 text-center shadow-sm rounded-3">No Registered Blood Center</div>`
    }
    get_bloodCenters.innerHTML = bloodCenter;
    }

    function getAvailStocks(inventory, org_id) {
        let stocks = "";
        let hasStock = false;

        inventory.forEach((stock) => {
            const blood_type = stock.blood_type.concat(stock.rh_factor);

            if (stock.user_id == org_id) {
              hasStock = true;
                stocks += `<div class="d-flex mt-1">
                    <div class="has-body flex-grow-1">${blood_type}</div>
                    <div class="has-body flex-grow-1">${stock.component}</div>
                    <div class="has-body flex-grow-1">${stock.avail_blood_units}</div>
                </div>`;
            }
        });

        if(!hasStock) {
          stocks = `<div class="d-flex mt-1">
                    <div class="has-body flex-grow-1">No stocks Available</div>
                </div>`
        }

        return stocks;
    }

    document.querySelectorAll(".requestButton").forEach(button => {
      button.addEventListener("click", requestClick);
  });
}

function requestClick(e) {
  const id = e.target.getAttribute('data-id');
  console.log(id)
  requestBlood(id);
}

async function requestBlood(id) {
const request_form = document.getElementById("request_form_" + id);
console.log(request_form)

request_form.onsubmit = async (e) => {
  e.preventDefault();

  const requestButton = document.querySelector(".requestButton");

  requestButton.disabled = true;
  requestButton.innerHTML = `<div class="spinner-border" role="status"></div>`;

  const formData = new FormData(request_form);
for (const [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
}


  const requestResponse = await fetch(backendURL + "/api/bloodrequest", {
    method: "POST", 
    headers:{
      Accept: "application/json", 
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  const json_request = await requestResponse.json();

  if(requestResponse.ok){
    request_form.reset();
    displayToastMessage("create-success");
  }else{
    displayToastMessage("create-fail");
    console.log(json_request.message);
  }

  requestButton.disabled = false;
  requestButton.innerHTML = `Request`;
} 
}


