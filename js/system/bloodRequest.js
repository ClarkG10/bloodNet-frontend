import { backendURL, logout, formatTimeDifference, hasThreeMinutesPassed, displayToastMessage } from "../utils/utils.js";

logout();
getDatas();

const headers = {
  Accept: "application/json",
  Authorization: "Bearer " + localStorage.getItem("token"),
};

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

    const [requestResponse, organizationAll] = await Promise.all([
      await fetch(url || backendURL + "/api/bloodrequest" + queryParams, { headers }),
      await fetch(backendURL + "/api/mobile/organization", { headers }),
    ]);

    const [json_request, json_organizationAll] = await Promise.all([
      await requestResponse.json(),
      await organizationAll.json(),
    ]);

    let hasRequest = false, requests = "";

    console.log(json_request)

    const filteredRequest = filteredUrgencyScale === 'All'
        ? json_request.data
        : json_request.data.filter(request => request.urgency_scale === filteredUrgencyScale);

    filteredRequest.forEach((request) => {
            hasRequest = true;
            const receiverOrg = json_organizationAll.find(org => org.user_id === request.receiver_id);
            const updateButtonVisible = hasThreeMinutesPassed(request.created_at);
            const orgType = localStorage.getItem("type");

            requests += requestHTML(request, receiverOrg, orgType, updateButtonVisible);
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

    document.querySelectorAll(".deleteButton").forEach(button => {
        button.addEventListener("click", deleteClick);
    });
    document.querySelectorAll(".updateRequest").forEach(button => {
        button.addEventListener("click", updateRequestClick);
    });

    document.getElementById("pages").innerHTML = pagination;

    document.querySelectorAll("#pages .page-link").forEach((link) => {
    link.addEventListener("click", pageAction);
    });
}

function requestHTML(request, receiverOrg, orgType, updateButtonVisible) {
    return `<div class="d-flex has-head shadow-sm">
        <div class="has-body" style="width: 350px">${receiverOrg.org_name}</div>
        <div class="has-body">${formatTimeDifference(request.created_at)}</div>
        <div class="has-body">${request.blood_type}</div>
        <div class="has-body">${request.component}</div>
        <div class="has-body">${request.quantity}</div>
        <div class="has-body fw-bold ${request.status === "Accepted" ? "text-success" : request.status === "Declined" ? "text-danger" : ""}">${request.status}</div>
        <div class="has-body">
            <span class="bg-secondary-subtle py-2 rounded-4 fw-bold ${request.urgency_scale === "Critical" || request.urgency_scale === "Urgent" ? "text-danger" : ""}" style="width: 90px">
                ${request.urgency_scale}
            </span>
        </div>
        <div class="has-body" style="width: 240px">
            <div class="d-flex justify-content-center">
              <!-- Update button logic -->
              ${updateButtonVisible || orgType !== "Hospital" ? `` : `
                <button class="btn updateButton me-1" data-bs-toggle="modal" data-bs-target="#updateRequestModal_${request.request_id}">
                  Update
                </button>`}
            ${ orgType === "Hospital" ? `
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
                </button>` 
              : ``}
          </div>
        </div>
    </div>
    
    ${orgType === "Hospital" ? `${updateModalContent(request, receiverOrg)}` : ``}
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

function updateModalContent(request, receiverOrg) {
  return `<!-- Update Request Modal -->
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
`
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

function updateRequestClick(e) {
  const request_id = e.target.getAttribute("data-id");
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
              method: "POST", headers, body: formData,
          });

          const json_request = await requestResponse.json();

          if (requestResponse.ok) {
              displayToastMessage("update-success");
              document.querySelector(`#updateRequestModal_${id} .modal_close`).click();
              await getDatas();
          } else {
              displayToastMessage("update-fail");
              console.error(json_request.error);
          }
      }
  }

async function deleteRequest(id) {
  if (confirm("Are you sure you want to delete this item?")) {
      const requestResponse = await fetch(backendURL + "/api/bloodrequest/" + id, {
          method: "DELETE", headers });

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

