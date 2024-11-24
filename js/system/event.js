import { backendURL, logout, userlogged, jsonToCSV, displayToastMessage, getPendingRequest} from "../utils/utils.js";

userlogged();
logout();
getPendingRequest();

const event_form = document.getElementById("event_form");
const generateReportButton = document.getElementById("generateEventReport");

const headers = {
  Accept: "application/json",
  Authorization: "Bearer " + localStorage.getItem("token"),
};

event_form.onsubmit = async (e) => {
    e.preventDefault();

    const create_event = document.querySelector(".createEventButton");
    create_event.disabled = true;
    create_event.innerHTML = `<div class="spinner-border" role="status"></div>`;

    const formData = new FormData(event_form);

    const eventResponse = await fetch(backendURL + "/api/event",{
        method: "POST",
        headers,
        body: formData,
    });

    const json_event = await eventResponse.json();

    if(eventResponse.ok){
        event_form.reset();
        displayToastMessage("create-success");
        await getDatas();
    }else{
      displayToastMessage("create-fail");
        console.log(json_event.message);
    }
    create_event.disabled = false;
    create_event.innerHTML = `Create` ;
}

generateReportButton.onclick = async () => {
  const eventResponse = await fetch(backendURL + "/api/event/all", { headers });
  const json_event = await eventResponse.json();

  console.log(json_event)
  if (eventResponse.ok) {
      const csvData = jsonToCSV(json_event);
      downloadCSV(csvData, 'events_report.csv');
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

const get_events = document.getElementById("get_event");
  
get_events.innerHTML = ` <div class="d-flex request-head shadow-sm">
      ${'<div class="event-hasevents"><span class="spinner-border" role="status"></span></div>'.repeat(7)}
    </div>`;
document.getElementById('sortStatus').addEventListener('change', function() {
  getDatas(this.value);
});

async function getDatas(filteredStatus = 'All', url = "", keyword = "") {
let queryParams = 
    "?" + 
    (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) : "");
  
    const eventResponse = await fetch(url || backendURL + "/api/event" + queryParams, { headers});
    const eventResponseAll = await fetch( backendURL + "/api/event/all", { headers });

    const json_event = await eventResponse.json();
    const json_eventAll = await eventResponseAll.json();

    if (eventResponse.ok) {
      let hasEvent = false;
      let events = "";
      const eventData = json_event.data;
  
      if (Array.isArray(eventData)) {
        const filteredEvent = filteredStatus === 'All' ? eventData 
        : json_eventAll.filter(event => event.status === filteredStatus);
  
        filteredEvent.forEach((event) => {
          hasEvent = true;
          events += createEventHTML(event);
        });
      } else {
          console.error("Unexpected data format:", json_event);
      }

      if (!hasEvent) {
          events = noEventHTML();
      }
      get_events.innerHTML = events;

      let pagination = "";
      if (json_event.links) {
          json_event.links.forEach((link) => {
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
    document.querySelectorAll(".updateButton").forEach(button => {
        button.addEventListener("click", updateClickInfo);
    });
    document.querySelectorAll(".updateStatusButton").forEach(button => {
        button.addEventListener("click", updateClickStatus);
    });
      document.getElementById("pages").innerHTML = pagination;
      document.querySelectorAll("#pages .page-link").forEach((link) => {
          link.addEventListener("click", pageAction);
      });
  }else {
      alert(json_event.message);
  }
}

function createEventHTML(event){
  return `<div class="d-flex request-head shadow-sm">
            <div class="event-hasevents">${event.event_name}</div>
            <div class="event-hasevents">${event.event_location}</div>
            <div class="event-hasevents">${event.start_date}</div>
            <div class="event-hasevents">${event.end_date}</div>
            <div class="event-hasevents">${event.time_start} to ${event.time_end}</div>
            <div class="event-hasevents fw-bold ${event.status == "Completed" ? `text-success` : event.status == "Cancelled" ? `text-danger`: ``}">${event.status}</div>
            <div class="event-hasevents">
              <div class="d-flex align-items-center justify-content-center">
              ${event.status == "Completed" || event.status == "Cancelled" ? 
                `<button
                      class="bg-secondary-subtle deleteButton me-1 d-flex align-items-center justify-content-center"
                      style="
                      cursor: pointer;
                      border-radius: 5px;
                      padding: 9px !important;
                      border: none !important;
                      padding-left: 12px !important;
                      padding-right: 12px !important;
                      "
                      data-id="${event.event_id}"
                      >
                    <img src="assets/icon/trash.png" alt="" width="16px" />
                  </button>`: 
                `<button
                  class="btn updateButton me-1"
                  data-bs-toggle="modal"
                  data-bs-target="#updateEventModal_${event.event_id}"
                  data-id="${event.event_id}"
                >
                  Update
                </button>`}
              
                <button
                  class="btn updateButton1"
                  data-bs-toggle="modal"
                  data-bs-target="#viewEventModal_${event.event_id}"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
          <!-- View Event Modal -->
          <div class="modal fade" id="viewEventModal_${event.event_id}" tabindex="-1" aria-labelledby="viewEventModalLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="viewEventModalLabel">Event Details</h5>
                  <button type="button" class="btn-close me-1" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body font-size">
                  <table>
                    <tr>
                      <td><strong>Event Name:</strong></td>
                      <td class="ps-4">${event.event_name}</td>
                    </tr>
                    <tr>
                      <td><strong>Location:</strong></td>
                      <td class="ps-4">${event.event_location}</td>
                    </tr>
                    <tr>
                      <td><strong>Start Date:</strong></td>
                      <td class="ps-4">${event.start_date}</td>
                    </tr>
                    <tr>
                      <td><strong>End Date:</strong></td>
                      <td class="ps-4">${event.end_date}</td>
                    </tr>
                    <tr>
                      <td><strong>Start Time:</strong></td>
                      <td class="ps-4">${event.time_start}</td>
                    </tr>
                    <tr>
                      <td><strong>End Time:</strong></td>
                      <td class="ps-4">${event.time_end}</td>
                    </tr>
                    <tr>
                      <td><strong>Description:</strong></td>
                      <td class="ps-4">${event.description}</td>
                    </tr>
                    <tr>
                      <td><strong>Minimum Age:</strong></td>
                      <td class="ps-4">${event.min_age}</td>
                    </tr>
                    <tr>
                      <td><strong>Maximum Age:</strong></td>
                      <td class="ps-4">${event.max_age}</td>
                    </tr>
                    <tr>
                      <td><strong>Contact Information:</strong></td>
                      <td class="ps-4">${event.contact_info}</td>
                    </tr>
                    <tr>
                      <td><strong>Status:</strong></td>
                      <td class="ps-4">${event.status}</td>
                    </tr>
                      <tr>
                      <td><strong>Participants:</strong></td>
                      <td class="ps-4">${event.participants}</td>
                    </tr>
                  </table>
                </div>                 
                ${event.status == "Completed" || event.status == "Cancelled" ? ` `: `
                <div class="modal-footer" style="font-size: 15px">
                 <div class="d-flex align-items-center justify-content-center">
                  <button
                      class="bg-secondary-subtle deleteButton me-2 d-flex align-items-center justify-content-center"
                      style="
                      cursor: pointer;
                      border-radius: 5px;
                      padding: 9px !important;
                      border: none !important;
                      padding-left: 12px !important;
                      padding-right: 12px !important;
                      "
                      data-id="${event.event_id}"
                      >
                    <img src="assets/icon/trash.png" alt="" width="15px" />
                  </button>
                  ${event.status !== "Completed" && event.status !== "Cancelled" ? `
                  <form id="update_status_complete_${event.event_id}">
                    <input type="hidden" name="status" value="Completed">
                    <button
                      type="submit"
                      class="updateStatusButton updateButton1 me-2"
                      data-id="${event.event_id}"
                      data-status="complete"
                    >
                      Finish
                    </button>
                  </form>
                  <form id="update_status_cancel_${event.event_id}">
                    <input type="hidden" name="status" value="Cancelled">
                    <button
                      type="submit"
                      class="updateStatusButton buttonBack1"
                      data-id="${event.event_id}"
                      data-status="cancel"
                    >
                      Cancel Event
                    </button>
                  </form>` : ""}
                  </div>
                </div>
                `}
              </div>
            </div>
          </div>
          <!-- View Event Modal -->
          
  <!-- Update Event Modal -->
  <div
    class="modal fade"
    id="updateEventModal_${event.event_id}"
    tabindex="-1"
    aria-labelledby="updateEventModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <div id="updateEventModalLabel">
            <span class="fw-bold fs-4">Update Blood Donation Event</span>
          </div>
        </div>
        <div class="modal-body">
          <form id="update_form_${event.event_id}">
            <div class="d-flex gap-2 mt-2">
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="text"
                  class="form-control"
                  id="eventName"
                  name="event_name"
                  value="${event.event_name}"
                  
                />
                <label for="eventName">Event Name</label>
              </div>
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="text"
                  class="form-control"
                  id="eventLocation"
                  name="event_location"
                  value="${event.event_location}"
                  
                />
                <label for="eventLocation">Location</label>
              </div>
            </div>
            <div class="d-flex gap-2">
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="date"
                  class="form-control"
                  id="startDate"
                  name="start_date"
                  value="${event.start_date}"
                  
                />
                <label for="startDate">Start Date</label>
              </div>
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="date"
                  class="form-control"
                  id="endDate"
                  name="end_date"
                  value="${event.end_date}"
                  
                />
                <label for="endDate">End Date</label>
              </div>
            </div>
            <div class="d-flex gap-2">
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="text"
                  class="form-control"
                  id="timeStart"
                  name="time_start"
                  value="${event.time_start}"
                  
                />
                <label for="timeStart">Time Start</label>
              </div>
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="text"
                  class="form-control"
                  id="timeEnd"
                  name="time_end"
                  value="${event.time_end}"
                  
                />
                <label for="timeEnd">Time End</label>
              </div>
            </div>
            <div class="d-flex gap-2">
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="number"
                  class="form-control"
                  id="minimumAge"
                  name="min_age"
                  value="${event.min_age}"
                  
                />
                <label for="minimumAge">Minimum Age</label>
              </div>
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="number"
                  class="form-control"
                  id="maximumAge"
                  name="max_age"
                  value="${event.max_age}"
                  
                />
                <label for="maximumAge">Maximum Age</label>
              </div>
            </div>
            <div class="d-flex gap-2">
              <div class="form-floating mb-3 flex-grow-1">
                <textarea
                  class="form-control"
                  placeholder="Leave a description here"
                  id="description"
                  name="description"
                  style="height: 150px"
                >${event.description}</textarea>
                <label for="description">Description</label>
              </div>
            </div>
            <div class="d-flex gap-2">
              <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="text"
                  class="form-control"
                  id="contactInfo"
                  name="contact_info"
                  value="${event.contact_info}"
                  
                />
                <label for="contactInfo">Contact Information</label>
              </div>
                <div class="form-floating mb-3 flex-grow-1">
                <input
                  type="number"
                  class="form-control"
                  id="participants"
                  name="participants"
                  value="${event.participants}"
                  
                />
                <label for="participants">Participants</label>
              </div>
            </div>
            <div class="d-flex gap-1">
              <div class="form-floating mb-3 flex-grow-1">
                  <input type="file" class="form-control" id="image" name="image" accept=".png, .jpg, .jpeg" />
                  <label for="address">Event Picture (optional)  </label>
              </div>
          </div>
            <div class="modal-footer">
            <button
                type="submit"
                class="button1 justify-content-center align-items-center d-flex"
                id="updateEventButton_${event.event_id}"
                data-id="${event.event_id}"
                style="font-size: 16px"
              >
                Update
              </button>
              <button
                type="button"
                class="buttonBack"
                data-bs-dismiss="modal"
                style="font-size: 16px"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`
}

function noEventHTML() {
  return `<!-- For No New Event -->
          <div class="d-flex norequest-head shadow-sm">
            <div class="event-noevents"></div>
            <div class="event-noevents"></div>
            <div class="event-noevents mt-3 mb-3">No Event</div>
            <div class="event-noevents"></div>
            <div class="event-noevents"></div>
            <div class="event-noevents></div>
          </div>
          <!-- For No New Event -->`
}

const event_search_form = document.getElementById("search_form");
event_search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(event_search_form); 
    const keyword = formData.get("keyword");
    
    getDatas("All", "", keyword);
}

const pageAction = async (e) => {
  e.preventDefault();
  const url = e.target.getAttribute("data-url");
  await getDatas('All', url);
}

getDatas();

function updateClickInfo(e) {
    const event_id = e.target.getAttribute("data-id");
    console.log(event_id)
    updateEventInfo(event_id);
  }

async function updateEventInfo(id) {
    const update_form = document.getElementById("update_form_" + id);

    if (!update_form) return;

    update_form.onsubmit = async (e) => {
        e.preventDefault();

        const updateButton = document.querySelector("#updateEventButton_" + id);
        updateButton.disabled = true;
        updateButton.innerHTML = `<div class="spinner-border" role="status"></div>`;

        const formData = new FormData(update_form);
        formData.append("_method", "PUT");

        try {
            const eventResponse = await fetch(backendURL + "/api/event/eventInfo/" + id, {
                method: "POST",
                headers,
                body: formData,
            });

            const json_event = await eventResponse.json();

            if (eventResponse.ok) {
                displayToastMessage("update-success");
                document.querySelector(`#updateEventModal_${id} .buttonBack`).click();
                await getDatas();
            } else {
                throw new Error(json_event.message);
            }
        } catch (error) {
            displayToastMessage("update-fail");
            console.error("Update failed:", error.message);
        }

        updateButton.disabled = false;
        updateButton.innerHTML = `Update`;
    }
}

  function updateClickStatus(e) {
      const event_id = e.target.getAttribute("data-id");
      const event_status = e.target.getAttribute("data-status");
      console.log(event_status, event_id)
      updateEventStatus(event_id, event_status);
    }
  

    async function updateEventStatus(id, status) {
        if (confirm(`Are you sure you want to ${status} this event item?`)) {
            const statusFormId = status === "complete" ? `update_status_complete_${id}` : `update_status_cancel_${id}`;
            const status_form = document.getElementById(statusFormId);
    
            if (!status_form) return;
    
            status_form.onsubmit = async (e) => {
                e.preventDefault();
    
                const formData = new FormData(status_form);
                formData.append("_method", "PUT");
    
                const eventResponse = await fetch(backendURL + "/api/event/status/" + id, {
                    method: "POST",
                    headers,
                    body: formData,
                });
    
                const json_event = await eventResponse.json();
    
                if (eventResponse.ok) {
                  displayToastMessage("update-success");
                    document.querySelector(`#viewEventModal_${id} .btn-close`).click();
                    await getDatas();
                } else {
                  displayToastMessage("update-fail");
                    console.error("Update status failed:", json_event.message);
                }
            }
        }
    }

async function deleteEvent(id) {
  if (confirm("Are you sure you want to delete this event item?")) {
      const eventResponse = await fetch(backendURL + "/api/event/" + id, {
          method: "DELETE",
          headers,
      });

      const json_event = await eventResponse.json();

      if (eventResponse.ok) {
        displayToastMessage("delete-success");
        document.querySelector(`#viewEventModal_${id} .btn-close`).click();
          await getDatas();
      } else {
        displayToastMessage("delete-fail");
          console.error("Delete failed:", json_event.message);
      }
  }
}

function deleteClick(event) {
  const event_id = event.currentTarget.getAttribute('data-id');
  console.log(event_id)
  deleteEvent(event_id);
}
