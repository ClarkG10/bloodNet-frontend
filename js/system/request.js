import { backendURL, logout, jsonToCSV, formatTimeDifference, hasThreeMinutesPassed, displayToastMessage, getPendingRequest } from "../utils/utils.js";

logout();
getDatas();
getPendingRequest();  


if (localStorage.getItem("type") === "Blood Center"){
const generateReportButton = document.getElementById("generateRequestReport");

generateReportButton.onclick = async () => {
    const requestResponse = await fetch(backendURL + "/api/bloodrequest/all", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        }
    });
  
    const json_request = await requestResponse.json();
    console.log(json_request)
    if (requestResponse.ok) {
        const csvData = jsonToCSV(json_request);
        downloadCSV(csvData, 'requests_report.csv');
    }
  };
}
  
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

document.getElementById('sortUrgencyScale').addEventListener('change', function() {
    getDatas(this.value);
});

async function getDatas(filteredUrgencyScale = "All", url = "", keyword = "") {
  const get_request = document.getElementById("get_request");

    get_request.innerHTML = `            
        <div class="d-flex has-head shadow-sm">
        <div class="has-body" style="width: 250px"><span class="spinner-border" role="status"></span></div>
          ${'<div class="has-body"><span class="spinner-border" role="status"></span></div>'.repeat(7)}
        </div>
    `;

    let queryParams = 
    "?" + 
    // (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) + "&" : "");

    const requestResponse = await fetch(url || backendURL + "/api/bloodrequest/all" + queryParams, {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        }
    });

    const organizationResponse = await fetch(backendURL + "/api/organization",  {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        }
    });

    const organizationAll = await fetch(backendURL + "/api/mobile/organization",  {
      headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
      }
  });

  const profileResponse = await fetch(backendURL + "/api/profile/show",  {
    headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
    }
});
  
    const json_request = await requestResponse.json();
    const json_organization = await organizationResponse.json();
    const json_organizationAll = await organizationAll.json();
    const json_profile = await profileResponse.json();

    const organizations = Array.isArray(json_organization) ? json_organization : json_organization.data; 

    let hasRequest = false;
    let requests = "";

    const filteredRequest = filteredUrgencyScale === 'All' ? json_request : json_request.filter(request => request.urgency_scale === filteredUrgencyScale);

    filteredRequest.forEach((request) => {
     console.log(organizations[0].user_id, request.receiver_id, json_profile?.user_id, request.receiver_id )

      const condition = localStorage.getItem("type") === "Blood Center" 
      ? request.receiver_id === organizations[0]?.user_id || json_profile?.user_id === request.receiver_id 
      : request.user_id === organizations[0]?.user_id || json_profile?.user_id === request.user_id;
    
      if(condition){
          hasRequest = true;
          const requestOrg = json_organizationAll.find(org => org.user_id === request.user_id)
          const receiverOrg = json_organizationAll.find(org => org.user_id === request.receiver_id)
          const orgType = localStorage.getItem("type"); 
        
          requests += requestHTML(request, requestOrg, receiverOrg, orgType);
        }
    });
    
    if (!hasRequest) {
        requests = `<!-- For No New Request-->
        <div class="d-flex shadow-sm">
          <div class="no-body"></div>
          <div class="no-body"></div>
          <div class="no-body fw-bold"></div>
          <div class="no-body mt-3 mb-3">No Request</div>
          <div class="no-body"></div>
          <div class="no-body"></div>
          <div class="no-body text-center" id="color"></div>
        </div>
        <!-- For No New Request-->`
    }

    get_request.innerHTML = requests;

    // let pagination = "";

    // if (json_request.links) {
    //     json_request.links.forEach((link) => {
    //         pagination += `
    //             <li class="page-item" >
    //                 <a class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" data-url="${link.url}" style="color: #b43929">
    //                     ${link.label}
    //                 </a>
    //             </li>`;
    //     });
    // }

    document.querySelectorAll(".deleteButton").forEach(button => {
        button.addEventListener("click", deleteClick);
    });

    document.querySelectorAll(".updateStatusButton").forEach(button => {
        button.addEventListener("click", updateClickStatus);
    });

    document.querySelectorAll(".updateRequest").forEach(button => {
      button.addEventListener("click", updateRequestClick);
  });


    // document.getElementById("pages").innerHTML = pagination;

    // document.querySelectorAll("#pages .page-link").forEach((link) => {
    //     link.addEventListener("click", pageAction);
    // });
}

function requestHTML(request, requestOrg, receiverOrg, orgType) {
  const updateButtonVisible = hasThreeMinutesPassed(request.created_at);
  console.log(updateButtonVisible)

  return `<div class="d-flex has-head shadow-sm">
      <div class="has-body" style="width: 250px">${orgType === "Blood Center" ? `${requestOrg.org_name}` : `${receiverOrg.org_name}`}</div>
      <div class="has-body">${formatTimeDifference(request.created_at)}</div>
      <div class="has-body">${request.blood_type}</div>
      <div class="has-body">${request.component}</div>
      <div class="has-body">${request.quantity}</div>
      <div class="has-body fw-bold ${request.status == "Accepted" ? `text-success` : request.status == "Declined" ? `text-danger` : `` }">${request.status}</div>
      <div class="has-body">
        <span class="bg-secondary-subtle py-2 rounded-4 fw-bold ${request.urgency_scale === "Critical" || request.urgency_scale === "Urgent" ? "text-danger" : ""}" style="width: 90px">
          ${request.urgency_scale}
        </span>
      </div>
      <div class="has-body">
        <div class="d-flex justify-content-center">
          ${orgType === "Blood Center" ? `
            <button class="btn updateButton me-1" data-bs-toggle="modal" data-bs-target="#upStatusRequestModal_${request.request_id}">
              Details
            </button>` : ``}
          ${updateButtonVisible && orgType === "Hospital" || request.status === "Accepted" || request.status === "Declined" || orgType != "Hospital" ? `` : `
            <button class="btn updateButton me-1" data-bs-toggle="modal" data-bs-target="#updateRequestModal_${request.request_id}">
              Update
            </button>`}
          <button
            class="bg-secondary-subtle deleteButton"
            style="
              cursor: pointer;
              padding: 5px !important;
              border-radius: 5px;
              border: none !important;
              padding-left: 12px !important;
              padding-right: 12px !important;
            "
            data-id="${request.request_id}"
          >
            <img src="assets/icon/trash.png" alt="" width="15px" />
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
    <!-- Update Request Modal -->

    <!-- Update Status Modal -->
    <div class="modal fade" id="upStatusRequestModal_${request.request_id}" tabindex="-1" aria-labelledby="upStatusRequestModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="upStatusRequestModalLabel">Request Details</h5>
            <button type="button" class="btn-close me-1" data-bs-dismiss="modal" aria-label="Close" style="box-shadow: none"></button>
          </div>
          <div class="modal-body font-size">
            <span><strong>Hospital: </strong>${requestOrg.org_name}</span><br />
            <span><strong>Request at: </strong>${formatTimeDifference(request.created_at)}</span><br />
            <span><strong>Blood type: </strong>${request.blood_type}</span><br />
            <span><strong>Component: </strong>${request.component}</span><br />
            <span><strong>Quantity: </strong>${request.quantity}</span><br />
            <span><strong>Status: </strong>${request.status}</span><br />
            <span><strong>Urgency Scale: </strong>${request.urgency_scale}</span><br />
          </div>
         <div class="modal-footer d-flex justify-content-end" style="font-size: 16px">
              ${request.status === "Pending" ? `
                  <form id="update_status_accept_${request.request_id}">
                      <input type="hidden" name="status" value="Accepted">
                      <button class="btn btn-success rounded-2 updateStatusButton" data-id="${request.request_id}" data-status="accept">Accept</button>
                  </form>
                  <form id="update_status_decline_${request.request_id}">
                      <input type="hidden" name="status" value="Declined">
                      <button class="btn decline updateStatusButton" data-id="${request.request_id}" data-status="decline">Decline</button>
                  </form>
              ` : request.status === "Accepted" && !hasThreeMinutesPassed(request.updated_at) ? `
                  <button class="btn btn-secondary rounded-2 updateStatusButton" data-id="${request.request_id}" data-status="undo">Undo</button>
              ` : request.status === "Declined" && !hasThreeMinutesPassed(request.updated_at) ? `
                  <button class="btn btn-secondary rounded-2 updateStatusButton" data-id="${request.request_id}" data-status="undo">Undo</button>
              ` :""  }
          </div>
        </div>
      </div>
    </div>
    <!-- Update Status Modal -->
  `;
}

const request_search_form = document.getElementById("search_form");
request_search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(request_search_form); 
    const keyword = formData.get("keyword");
    console.log(keyword);

    getDatas("All", "", keyword);
}

// const pageAction = async (e) => {
//     e.preventDefault();
//     const url = e.target.getAttribute("data-url");
//     await getDatas('All', url);
// }

function updateClickStatus(e) {
    const request_id = e.target.getAttribute("data-id");
    const request_status = e.target.getAttribute("data-status");
    console.log(request_status, request_id);
    updateRequestStatus(request_id, request_status);
}

async function updateRequestStatus(id, status) {
  if (confirm(`Are you sure you want to ${status} this request item?`)) {
      const statusFormId = status === "accept" ? `update_status_accept_${id}` :
                           status === "decline" ? `update_status_decline_${id}` : null;

      if (status === "undo") {
          const undoFormData = new FormData();
          undoFormData.append("status", "Pending");
          undoFormData.append("_method", "PUT");

          const undoRequest = await fetch(backendURL + "/api/bloodrequest/status/" + id, {
              method: "POST",
              headers: {
                  Accept: "application/json",
                  Authorization: "Bearer " + localStorage.getItem("token"),
              },
              body: undoFormData,
          });

          const undoJson = await undoRequest.json();

          if (undoRequest.ok) {
              displayToastMessage("update-success");
              document.querySelector(`#upStatusRequestModal_${id} .btn-close`).click();
              await getDatas();
              getPendingRequest();
          } else {
              displayToastMessage("update-fail");
              console.error("Undo action failed:", undoJson.message);
          }
      }

      const status_form = document.getElementById(statusFormId);
      if (!status_form) return;

      status_form.onsubmit = async (e) => {
          e.preventDefault();

          const formData = new FormData(status_form);
          formData.append("_method", "PUT");

          const requestResponse = await fetch(backendURL + "/api/bloodrequest/status/" + id, {
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
              document.querySelector(`#upStatusRequestModal_${id} .btn-close`).click();   
              await getDatas();
              getPendingRequest();
          } else {
              displayToastMessage("update-fail");
              console.error("Update status failed:", json_request.message);
          }
      };
  }
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

async function deleteRequest(id) {
  if (confirm("Are you sure you want to delete this item?")) {
      const requestResponse = await fetch(backendURL + "/api/bloodrequest/" + id, {
          method: "DELETE",
          headers: {
              Accept: "application/json",
              Authorization: "Bearer " + localStorage.getItem("token"),
          },
      });

      const json_request = await requestResponse.json();

      if (requestResponse.ok) {
          displayToastMessage("delete-success");
          await getDatas();
      } else {
          displayToastMessage("delete-fail");
          console.error("Delete failed:", json_request.message);
      }
  }
}

function deleteClick(e) {
    const request_id = e.currentTarget.getAttribute('data-id');
    console.log(request_id);
    deleteRequest(request_id);
}

