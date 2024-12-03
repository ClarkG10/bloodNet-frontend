import { backendURL, logout, jsonToCSV, formatTimeDifference, hasThreeMinutesPassed, displayToastMessage, getPendingRequest } from "../utils/utils.js";

logout();
getDatas();
getPendingRequest(); 

const headers = {
  Accept: "application/json",
  Authorization: "Bearer " + localStorage.getItem("token"),
};

    const generateReportButton = document.getElementById("generateRequestReport");

    generateReportButton.onclick = async () => {
        const requestResponse = await fetch(backendURL + "/api/bloodrequest/all", { headers });

        const json_request = await requestResponse.json();
        if (requestResponse.ok) {
            const csvData = jsonToCSV(json_request);
            downloadCSV(csvData, 'requests_report.csv');
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

document.getElementById('sortUrgencyScale').addEventListener('change', function () {
    getDatas(this.value);
});

const get_request = document.getElementById("get_request");

get_request.innerHTML = `
    <div class="d-flex has-head shadow-sm">
    <div class="has-body" style="width: 350px"><span class="spinner-border" role="status"></span></div>
    <div class="has-body"><span class="spinner-border" role="status"></span></div>
    <div class="has-body"><span class="spinner-border" role="status"></span></div>
    <div class="has-body"><span class="spinner-border" role="status"></span></div>
    <div class="has-body"><span class="spinner-border" role="status"></span></div>
    <div class="has-body"><span class="spinner-border" role="status"></span></div>
    <div class="has-body"><span class="spinner-border" role="status"></span></div>
    <div class="has-body" style="width: 252px"><span class="spinner-border" role="status"></span></div>
    </div>
`;

async function getDatas(filteredUrgencyScale = "All", url = "", keyword = "") {
  const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  };

  let queryParams = 
  "?" + 
  (url ? new URL(url).searchParams + "&" : "") + 
  (keyword ? "keyword=" + encodeURIComponent(keyword) : "");

    const [requestResponse, inventoryResponse, organizationAll, reserveBloodResponse] = await Promise.all([
      await fetch(url || backendURL + "/api/bloodrequest" + queryParams, { headers }),
      await fetch(backendURL + "/api/mobile/inventory", { headers }),
      await fetch(backendURL + "/api/mobile/organization", { headers }),
      await fetch(backendURL + "/api/all/reserveblood", { headers })
    ]);

    const [json_inventory, json_request, json_organizationAll, json_reserveblood] = await Promise.all([
      await inventoryResponse.json(),
      await requestResponse.json(),
      await organizationAll.json(),
      await reserveBloodResponse.json()
    ]);

    let hasRequest = false, requests = "";

    console.log(json_request)

    const filteredRequest = filteredUrgencyScale === 'All'
        ? json_request.data
        : json_request.data.filter(request => request.urgency_scale === filteredUrgencyScale);

    filteredRequest.forEach((request) => {
            hasRequest = true;
            const requestOrg = json_organizationAll.find(org => org.user_id === request.user_id);
            const updateButtonVisible = hasThreeMinutesPassed(request.updated_at);
            const orgType = localStorage.getItem("type");
            const viewStocks = orgType == "Blood Center" ? `data-bs-toggle="modal" data-bs-target="#viewStocks_${request.request_id}"` : ``;

            requests += requestHTML(json_inventory, request, requestOrg, orgType, updateButtonVisible, viewStocks, json_reserveblood);
    });

    if (!hasRequest) {
        requests = noRequestHTML();
    }
    get_request.innerHTML = requests;

    let pagination = "";
    if (json_request.links) {
      json_request.links.forEach((link) => {
            pagination += `
                <li class="page-item" >
                    <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}" style="color: #b43929">
                        ${link.label}
                    </a>
                </li>`;
        });
    }

    document.querySelectorAll(".updateStatusButton").forEach(button => {
        button.addEventListener("click", updateClickStatus);
    });
    document.querySelectorAll(".undoButton").forEach(button => {
      button.addEventListener("click", updateClickStatus);
  });

    document.getElementById("pages").innerHTML = pagination;

    document.querySelectorAll("#pages .page-link").forEach((link) => {
    link.addEventListener("click", pageAction);
    });
}

function requestHTML(json_inventory, request, requestOrg, orgType,  updateButtonVisible, viewStocks, json_reserveblood) {
    return `<div class="d-flex has-head shadow-sm">
        <div class="has-body" ${viewStocks} style="width: 350px">${requestOrg.org_name}</div>
        <div class="has-body" ${viewStocks}>${formatTimeDifference(request.created_at)}</div>
        <div class="has-body" ${viewStocks}>${request.blood_type}</div>
        <div class="has-body" ${viewStocks}>${request.component}</div>
        <div class="has-body" ${viewStocks}>${request.quantity}</div>
        <div class="has-body fw-bold ${request.status === "Accepted" ? "text-success" : request.status === "Declined" ? "text-danger" : ""}">${request.status}</div>
        <div class="has-body" ${viewStocks}>
            <span class="bg-secondary-subtle py-2 rounded-4 fw-bold ${request.urgency_scale === "Critical" || request.urgency_scale === "Urgent" ? "text-danger" : ""}" style="width: 90px">
                ${request.urgency_scale}
            </span>
        </div>
        <div class="has-body" style="width: 240px">
            <div class="d-flex justify-content-center">
              <!-- Accept/Decline button logic -->
              ${request.status === "Pending" && orgType === "Blood Center" ? `
                  <input type="hidden" name="status" value="Accepted">
                  <button class="btn btn-success rounded-2 mx-1 updateStatusButton" data-id="${request.request_id}" data-status="accept">Accept</button>
                  
                  <input type="hidden" name="status" value="Declined">
                  <button class="btn decline updateStatusButton" data-id="${request.request_id}" data-status="decline">Decline</button>` : ``}
              
              <!-- Undo button logic -->
              ${!updateButtonVisible && request.status !== "Pending" && orgType !== "Hospital"? `
                <button class="btn btn-outline-secondary undoButton" data-id="${request.request_id}" data-status="undo">Undo</button>` : ``}
            </div>
              
          </div>
        </div>
    </div>
    
    ${orgType === "Blood Center" ? `${viewStocksModal(request, requestOrg, json_inventory, json_reserveblood)}` : ``}
`;
}

function noRequestHTML(){
  return `<div class="d-flex shadow-sm">
            <div class="no-body"></div>
            <div class="no-body"></div>
            <div class="no-body fw-bold"></div>
            <div class="no-body mt-3 mb-3">No Request</div>
            <div class="no-body"></div>
            <div class="no-body"></div>
            <div class="no-body text-center" id="color"></div>
        </div>`
}

function viewStocksModal(request, requestOrg, json_inventory, json_reserveblood) {
  return `<!-- View stocks Modal -->
    <div class="modal fade" id="viewStocks_${request.request_id}" tabindex="-1" aria-labelledby="viewStockModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="viewStockModalLabel">${requestOrg.org_name}</h5>
            <button type="button" class="btn-close me-1" data-bs-dismiss="modal" aria-label="Close" style="box-shadow: none"></button>
          </div>
          <div class="modal-body font-size">
            <div class="row">

              <!-- Available Stocks Section -->
              <div class="col-6">
                <div class="d-flex">
                  <span class="fw-bold font-size d-flex ms-2">Remaining Stocks</span>
                </div>
                <div class="d-flex shadow-sm mt-1 bg-secondary" style="font-weight: bold; color: white; border-radius: 10px">
                  <div class="has-body flex-grow-1">Blood type</div>
                  <div class="has-body flex-grow-1">Component</div>
                  <div class="has-body flex-grow-1">Units</div>
                </div>
                ${getAvailStocks(json_inventory, request.user_id)}
              </div>

              <!-- Available Reserve Stocks Section -->
              <div class="col-6">
                <div class="d-flex">
                  <span class="fw-bold font-size d-flex ms-2">Remaining Reserve Stocks</span>
                </div>
                <div class="d-flex shadow-sm mt-1 bg-secondary" style="font-weight: bold; color: white; border-radius: 10px">
                  <div class="has-body flex-grow-1">Blood type</div>
                  <div class="has-body flex-grow-1">Component</div>
                  <div class="has-body flex-grow-1">Units</div>
                </div>
                ${getAvailStocks(json_reserveblood, request.user_id)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- View stocks Modal -->`;
}

function getAvailStocks(inventory, org_id) {
    let stocks = "";
    let hasStock = false;
  
    inventory.forEach((stock) => {
        const blood_type = stock.blood_type + stock.rh_factor;
  
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
      stocks =  `<div class="d-flex mt-1">
                <div class="has-body flex-grow-1">No stocks Available</div>
            </div>`;
    }
    return stocks;
  }

const pageAction = async (e) => {
    e.preventDefault();
    const url = e.target.getAttribute("data-url");
    await getDatas('All', url);
  }
  

const request_search_form = document.getElementById("search_form");
request_search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(request_search_form); 
    const keyword = formData.get("keyword");
    console.log(keyword);

    getDatas("All", "", keyword);
}

function updateClickStatus(e) {
    const request_id = e.target.getAttribute("data-id");
    const request_status = e.target.getAttribute("data-status");
    console.log(request_status, request_id);
    updateRequestStatus(request_id, request_status);
}

async function updateRequestStatus(id, status) {
  if (confirm(`Are you sure you want to ${status} this request item?`)) {
      const formData = new FormData();
      
      if (status === "undo") {
          formData.append("status", "Pending");
      } else if (status === "accept") {
          formData.append("status", "Accepted");
      } else if (status === "decline") {
          formData.append("status", "Declined");
      } else {
          console.error("Invalid status:", status);
          return;
      }

      formData.append("_method", "PUT");
      try {
          const response = await fetch(backendURL + "/api/bloodrequest/status/" + id, {
              method: "POST", headers, body: formData,
          });

          const responseData = await response.json();

          if (response.ok) {
              displayToastMessage("update-success");
              await getDatas(); 
              if(localStorage.getItem("type") == "Blood Center") {
              getPendingRequest(); 
              }
          } else {
              displayToastMessage("update-fail");
              console.error("Update status failed:", responseData.message);
          }
      } catch (error) {
          displayToastMessage("update-fail");
          console.error("An error occurred:", error);
      }
  }
}
