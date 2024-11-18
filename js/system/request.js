import { backendURL, logout, jsonToCSV, formatTimeDifference, hasThreeMinutesPassed, displayToastMessage, getPendingRequest } from "../utils/utils.js";

logout();
getDatas();
getPendingRequest();

if (localStorage.getItem("type") === "Blood Center") {
    const generateReportButton = document.getElementById("generateRequestReport");

    generateReportButton.onclick = async () => {
        const requestResponse = await fetch(backendURL + "/api/bloodrequest/all", {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
            }
        });

        const json_request = await requestResponse.json();
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

document.getElementById('sortUrgencyScale').addEventListener('change', function () {
    getDatas(this.value);
});

const get_request = document.getElementById("get_request");

get_request.innerHTML = `
    <div class="d-flex has-head shadow-sm">
        <div class="has-body" style="width: 250px"><span class="spinner-border" role="status"></span></div>
        ${'<div class="has-body"><span class="spinner-border" role="status"></span></div>'.repeat(7)}
    </div>
`;

async function getDatas(filteredUrgencyScale = "All", url = "", keyword = "") {
  const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
  };

    let queryParams =
        "?" +
        (keyword ? "keyword=" + encodeURIComponent(keyword) + "&" : "");

    const requestResponse = await fetch(url || backendURL + "/api/bloodrequest/all" + queryParams, { headers });
    const organizationResponse = await fetch(backendURL + "/api/organization", {  headers});
    const profileResponse = await fetch(backendURL + "/api/profile/show", { headers });
    const inventoryResponse = await fetch(backendURL + "/api/mobile/inventory", { headers });
    const organizationAll = await fetch(backendURL + "/api/mobile/organization", { headers });

    const json_inventory = await inventoryResponse.json();
    const json_request = await requestResponse.json();
    const json_organization = await organizationResponse.json();
    const json_organizationAll = await organizationAll.json();
    const json_profile = await profileResponse.json();

    const organizations = Array.isArray(json_organization) ? json_organization : json_organization.data;

    let hasRequest = false;
    let requests = "";

    const filteredRequest = filteredUrgencyScale === 'All'
        ? json_request
        : json_request.filter(request => request.urgency_scale === filteredUrgencyScale);

    filteredRequest.forEach((request) => {
        const condition = localStorage.getItem("type") === "Blood Center"
            ? request.receiver_id === organizations[0]?.user_id || json_profile?.user_id === request.receiver_id
            : request.user_id === organizations[0]?.user_id || json_profile?.user_id === request.user_id;

        if (condition) {
            hasRequest = true;
            const requestOrg = json_organizationAll.find(org => org.user_id === request.user_id);
            const receiverOrg = json_organizationAll.find(org => org.user_id === request.receiver_id);
            const orgType = localStorage.getItem("type");

            requests += requestHTML(json_inventory, request, requestOrg, receiverOrg, orgType);
        }
    });

    if (!hasRequest) {
        requests = `
        <div class="d-flex shadow-sm">
            <div class="no-body"></div>
            <div class="no-body"></div>
            <div class="no-body fw-bold"></div>
            <div class="no-body mt-3 mb-3">No Request</div>
            <div class="no-body"></div>
            <div class="no-body"></div>
            <div class="no-body text-center" id="color"></div>
        </div>`;
    }

    get_request.innerHTML = requests;

    document.querySelectorAll(".deleteButton").forEach(button => {
        button.addEventListener("click", deleteClick);
    });

    document.querySelectorAll(".updateStatusButton").forEach(button => {
        button.addEventListener("click", updateClickStatus);
    });

    document.querySelectorAll(".undoButton").forEach(button => {
      button.addEventListener("click", updateClickStatus);
  });

    document.querySelectorAll(".updateRequest").forEach(button => {
        button.addEventListener("click", updateRequestClick);
    });
}

function requestHTML(json_inventory, request, requestOrg, receiverOrg, orgType) {
    const updateButtonVisible = hasThreeMinutesPassed(request.created_at);
    const viewStocks = orgType == "Blood Center" ? `data-bs-toggle="modal" data-bs-target="#viewStocks_${request.request_id}"` : ``;

    return `<div class="d-flex has-head shadow-sm">
        <div class="has-body" ${viewStocks} style="width: 350px">${orgType === "Blood Center" ? requestOrg.org_name : receiverOrg.org_name}</div>
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
                ${updateButtonVisible || orgType !== "Hospital" ? `` : `
                <button class="btn updateButton me-1" data-bs-toggle="modal" data-bs-target="#updateRequestModal_${request.request_id}">
                    Update
                </button>`}
                ${request.status === "Pending" && orgType === "Blood Center" ? `
                <form id="update_status_accept_${request.request_id}">
                    <input type="hidden" name="status" value="Accepted">
                    <button class="btn btn-success rounded-2 mx-1 updateStatusButton" data-id="${request.request_id}" data-status="accept">Accept</button>
                </form>
                <form id="update_status_decline_${request.request_id}">
                    <input type="hidden" name="status" value="Declined">
                    <button class="btn decline updateStatusButton" data-id="${request.request_id}" data-status="decline">Decline</button>
                </form>` : ``}
                ${!updateButtonVisible && request.status !== "Pending" ? `
                <button class="btn btn-outline-secondary undoButton" data-id="${request.request_id}"  data-status="undo">Undo</button>` : ``}
            </div>
        </div>
    </div>`;
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

