import { backendURL, formatTimeDifference, logout, hasThreeMinutesPassed, displayToastMessage } from "../utils/utils.js";

getDatas();
logout();
const placeholders = `
<div class="placeholder-glow mt-2" role="status">
    <span class="placeholder rounded-3">Loading...</span>
</div>`;

const elements = [
"getTotalUnits",
"getTotalRequests",
"barChartLoader",        
"get_requests",
"lowStock",
"lineChartLoader",
"getTotalReserveUnits",
].map(id => document.getElementById(id));

elements.forEach(element => element.innerHTML = placeholders);

async function getDatas() {
    const [
        inventoryResponse, requestResponse, stockInResponse, stockOutResponse, profileResponse, organizationResponseAll, reservebloodResponse] = await Promise.all([
        fetchData("/api/inventory/all"), fetchData("/api/bloodrequest/all"), fetchData("/api/stockIn"), fetchData("/api/stockOut"),
         fetchData("/api/profile/show"), fetchData("/api/mobile/organization"), fetchData("/api/reserveblood/all"),
    ]);

    const json_inventory = await inventoryResponse.json();
    const json_request = await requestResponse.json();
    const stockInData = await stockInResponse.json();
    const stockOutData = await stockOutResponse.json();
    const json_profile = await profileResponse.json();
    const json_organizationAll = await organizationResponseAll.json();
    const json_reserveblood = await reservebloodResponse.json();

    handleRequests(json_request, json_organizationAll);
    handleStockAlerts(json_inventory);

    console.log(json_organizationAll)
    let totalUnits = json_inventory.reduce((sum, stock) => sum + parseInt(stock.avail_blood_units), 0);
    let totalReserveUnits = json_reserveblood.reduce((sum, stock) => sum + parseInt(stock.avail_blood_units), 0);
    
    let orgName = json_organizationAll.find(org => org.user_id === json_profile.id || org.user_id === json_profile.user_id);
    let matchCount = 0;

    json_request.forEach(requests => {
        if (requests.user_id === json_profile?.id || requests.user_id === json_profile?.user_id) {
            matchCount++;
        }
    });

    document.getElementById("getOrgName").innerHTML = `${orgName.org_name}`;
    elements[0].innerHTML = `<h4 class="fw-bold">${totalUnits}</h4>`;
    elements[1].innerHTML = `<h4 class="fw-bold">${matchCount}</h4>`;
    elements[6].innerHTML = `<h4 class="fw-bold">${totalReserveUnits}</h4>`;

    if (stockInResponse.ok && stockOutResponse.ok && profileResponse.ok) {
        processChartData(stockInData, stockOutData, json_profile);
    } else {
        console.error("Failed to fetch data from the server");
    }
}

function processChartData(stockInData, stockOutData, json_profile) {
    const combinedData = [...stockInData, ...stockOutData];
    combinedData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const monthlyData = combinedData.reduce((acc, stocks) => {
        if (json_profile.id === stocks.user_id || json_profile.user_id === stocks.user_id) {
            const date = new Date(stocks.created_at);
            const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;

            if (!acc[yearMonth]) {
                acc[yearMonth] = { stockIn: 0, stockOut: 0 };
            } if (stocks.units_in) {
                acc[yearMonth].stockIn += stocks.units_in;
            } else {
                acc[yearMonth].stockOut += stocks.units_out;
            }
        }
        return acc;
    }, {});

    const labels = Object.keys(monthlyData).map(key => {
        const [year, month] = key.split('-');
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        return `${monthName} ${year}`;
    });

    const dataStockIn = Object.values(monthlyData).map(value => value.stockIn);
    const dataStockOut = Object.values(monthlyData).map(value => value.stockOut);

    createBarChart(labels, dataStockIn, dataStockOut);
    createLineChart(labels, dataStockIn, dataStockOut);
}

function handleRequests(requests, organizations) {
    let requestHTML = "", hasRequest = false;
        requests.forEach(request => {
            if (request.status === "Pending") {
                const orgType = localStorage.getItem("type");
                hasRequest = true;
                const receiverOrg = organizations.find(org => org.user_id === request.receiver_id);
                requestHTML += createRequestHTML(request, receiverOrg, orgType);
            }
        });

    if(!hasRequest) {
        requestHTML = createNoRequestsHTML();
    }
    document.getElementById("get_requests").innerHTML = requestHTML;
    attachRequestListeners();

    document.querySelectorAll(".updateRequest").forEach(button => {
        button.addEventListener("click", updateRequestClick);
    });
}

function handleStockAlerts(inventory) {
    let alertHTML = "", hasAlert = inventory.some(stock => parseInt(stock.avail_blood_units) < 10);
    
    if (hasAlert) {
        inventory.forEach(stock => {
            if (parseInt(stock.avail_blood_units) < 10) {
                alertHTML += createAlertHTML(stock);
            }
        });
    } else {
        alertHTML = createNoStockAlertsHTML();
    }
    document.getElementById("lowStock").innerHTML = alertHTML;
}

function fetchData(endpoint) {
    return fetch(`${backendURL}${endpoint}`, {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });
}

function createBarChart(labels, dataStockIn, dataStockOut) {
    const ctx = document.querySelector("#inventoryBarChart");
   
    if (!ctx) { console.error("Chart element not found"); return; }

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Stock In",
                    data: dataStockIn,
                    backgroundColor: "#b43929",
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.9,
                },
                {
                    label: "Stock Out",
                    data: dataStockOut,
                    backgroundColor: "#AAAAAA",
                    borderWidth: 2,
                    borderRadius: 10,
                    barPercentage: 0.9,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    stacked: false,
                },
                y: {
                    beginAtZero: true,
                    stacked: false,
                },
            },
        },
    });
    document.querySelector("#barChartLoader").innerHTML = "";
}

function createLineChart(labels, dataStockIn, dataStockOut) {
    const ctx = document.querySelector("#inventoryLineChart");

    if (!ctx) { console.error("Line chart element not found"); return; }

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Stock In",
                    data: dataStockIn,
                    borderColor: "#b43929",
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2,
                },
                {
                    label: "Stock Out",
                    data: dataStockOut,
                    borderColor: "#AAAAAA",
                    fill: false,
                    tension: 0.1,
                    borderWidth: 2,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true,
                },
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
    document.querySelector("#lineChartLoader").innerHTML = "";
}

// HTML structure for requests and alerts
function createRequestHTML(request, receiverOrg, orgType) {
    const updateButtonVisible = hasThreeMinutesPassed(request.created_at);

    return `
      <div class="d-flex has-head shadow-sm">
        <div class="has-body">${receiverOrg.org_name}</div> 
        <div class="has-body">${formatTimeDifference(request.created_at)}</div>
        <div class="has-body">${request.blood_type}</div>
        <div class="has-body">${request.component}</div>
        <div class="has-body">${request.quantity}</div>
        <div class="has-body">
          <span class="bg-secondary-subtle py-2 px-4 rounded-4 fw-bold ${request.urgency_scale === "Critical" || request.urgency_scale === "Urgent" ? "text-danger" : ""}">
            ${request.urgency_scale}
          </span>
        </div>
        <div class="has-body">
          <div class="d-flex justify-content-center">
          ${updateButtonVisible && orgType === "Hospital" ? `` : `
            <button class="btn updateButton me-1" data-bs-toggle="modal" data-bs-target="#updateRequestModal_${request.request_id}">
              Update
            </button>`}
            <button class="bg-secondary-subtle deleteRequest " 
              style="cursor: pointer; padding: 5px !important; border-radius: 5px; border: none !important; padding-left: 12px !important; padding-right: 12px !important;" 
              data-id="${request.request_id}">
              <img src="assets/icon/trash.png" alt="" width="15px" data-id="${request.request_id}"/>
            </button>
          </div>
        </div>
      </div>
      
    <!-- Update Request Modal -->
    <div class="modal fade" id="updateRequestModal_${request.request_id}" tabindex="-1" aria-labelledby="requestModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="updateRequestModalLabel"><small>Requested to:</small> <br>${receiverOrg.org_name}</h5>
          </div>
          <div class="modal-body p-2">
            <form id="request_form_${request.request_id}">
              <div class="form-floating mb-3 mt-3">
                <select class="form-select form-control" id="bloodTypes" name="blood_type">
                  <option value="O-" ${request.blood_type === "O-" ? "selected" : ""}>O-</option>
                  <option value="A-" ${request.blood_type === "A-" ? "selected" : ""}>A-</option>
                  <option value="B-" ${request.blood_type === "B-" ? "selected" : ""}>B-</option>
                  <option value="AB-" ${request.blood_type === "AB-" ? "selected" : ""}>AB-</option>
                  <option value="O+" ${request.blood_type === "O+" ? "selected" : ""}>O+</option>
                  <option value="A+" ${request.blood_type === "A+" ? "selected" : ""}>A+</option>
                  <option value="B+" ${request.blood_type === "B+" ? "selected" : ""}>B+</option>
                  <option value="AB+" ${request.blood_type === "AB+" ? "selected" : ""}>AB+</option>
                </select>
                <label for="blood_type">Blood Type</label>
              </div>
              <div class="form-floating mb-3">
                <select class="form-select form-control" id="component" name="component" required>
                  <option value="Whole Blood" ${request.component === "Whole Blood" ? "selected" : ""}>Whole Blood</option>
                  <option value="Red Blood Cells" ${request.component === "Red Blood Cells" ? "selected" : ""}>Red Blood Cells</option>
                  <option value="White Blood Cells" ${request.component === "White Blood Cells" ? "selected" : ""}>White Blood Cells</option>
                  <option value="Platelets" ${request.component === "Platelets" ? "selected" : ""}>Platelets</option>
                  <option value="Plasma" ${request.component === "Plasma" ? "selected" : ""}>Plasma</option>
                  <option value="Cryoprecipitate" ${request.component === "Cryoprecipitate" ? "selected" : ""}>Cryoprecipitate</option>
                  <option value="Granulocytes" ${request.component === "Granulocytes" ? "selected" : ""}>Granulocytes</option>
                </select>
                <label for="component">Components</label>
              </div>
              <div class="form-floating mb-3">
                <select class="form-select form-control" id="urgency_scale" name="urgency_scale" required>
                  <option value="Routine" ${request.urgency_scale === "Routine" ? "selected" : ""}>Routine</option>
                  <option value="Non-urgent" ${request.urgency_scale === "Non-urgent" ? "selected" : ""}>Non-urgent</option>
                  <option value="Urgent" ${request.urgency_scale === "Urgent" ? "selected" : ""}>Urgent</option>
                  <option value="Critical" ${request.urgency_scale === "Critical" ? "selected" : ""}>Critical</option>
                </select>
                <label for="urgency_scale">Urgency Scale</label>
              </div>
              <div class="form-floating mb-3">
                <input type="number" class="form-control" id="quantity" name="quantity" placeholder="Units" value="${request.quantity}" />
                <label for="quantity">Units</label>
              </div>
              <hr />
              <div class="d-flex align-items-end justify-content-end">
                <button type="submit" class="button1 me-2 updateRequest justify-content-center" style="font-size: 16px" data-id="${request.request_id}">
                  Update
                </button>
                <button type="button" class="buttonBack modal_close" data-bs-dismiss="modal" style="font-size: 16px">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <!-- Update Request Modal -->`;
}

function createNoRequestsHTML() {
    return`<!-- For No New Request-->
              <div class="d-flex shadow-sm">
              <div class="no-body"></div>
              <div class="no-body"></div>
              <div class="no-body"></div>
              <div class="no-body mt-3 mb-3">No Request</div>
              <div class="no-body"></div>
              <div class="no-body"></div>
              <div class="no-body"></div>
              </div>
              <!-- For No New Request-->`
}

function createAlertHTML(stock) {
    return `
        <div class="row p-1 mb-2">
            <div class="col-2 pt-1">
                <img
                    src="assets/icon/warning.png"
                    alt=""
                    class="me-2"
                    width="40px"
                    height="40px"
                />
            </div>
            <div class="col-10 ps-4">
                <span>${stock.blood_type}${stock.rh_factor} (${stock.component})</span><br />
                <small id="color">${stock.avail_blood_units} units left</small>
            </div>
        </div>`;
}

function createNoStockAlertsHTML() {
    return`<div class="mt-4 text-center mb-4">
    <img src="assets/icon/like.png" alt="" width="45px" /><br />
    <div class="mt-2">No Low Stock</div>
    </div>`
}

function attachRequestListeners() {
    document.querySelectorAll(".deleteRequest").forEach(button => {
        button.addEventListener("click", async (e) => {
            const requestId = e.target.getAttribute("data-id");
            console.log(requestId);
            const confirmed = confirm("Are you sure you want to cancel this request?");
            
            if (confirmed) {
                try {
                    const response = await fetch(`${backendURL}/api/bloodrequest/${requestId}`, {
                        method: "DELETE",
                        headers: {
                            Accept: "application/json",
                            Authorization: "Bearer " + localStorage.getItem("token"),
                        },
                    });
                    if (response.ok) {
                        displayToastMessage("delete-success");
                        getDatas();
                    } else {
                        displayToastMessage("delete-fail");
                    }
                } catch (error) {
                    console.error(error);
                    alert("An error occurred while canceling the request.");
                }
            }
        });
    });
}


function updateRequestClick(e) {
    const request_id = e.target.getAttribute("data-id");
    console.log(request_id);
    updateRequest(request_id);
  }
  
  async function updateRequest(id) {
        const status_form = document.getElementById("request_form_" + id);
  
        if (!status_form) return;
  
        status_form.onsubmit = async (e) => {
            e.preventDefault();
  
            const formData = new FormData(status_form);
            formData.append("_method", "PUT");
  
            const requestResponse = await fetch(backendURL + "/api/bloodrequest/" + id, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token"),
                },
                body: formData,
            });
  
            const json_request = await requestResponse.json();
  
            if (requestResponse.ok) {
                displayToastMessage("update-success");
                document.querySelector(`#updateRequestModal_${id} .modal_close`).click();
                await getDatas();
            } else {
                displayToastMessage("update-fail");
                console.error("Update failed:", json_request.message);
            }
        }
    }
