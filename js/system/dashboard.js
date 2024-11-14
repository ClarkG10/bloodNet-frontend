import { backendURL, logout, formatTimeDifference, displayToastMessage, getPendingRequest} from "../utils/utils.js";

logout();
getDatas();
getPendingRequest();

async function getDatas() {
  
    const placeholders = `
        <div class="placeholder-glow mt-2" role="status">
            <span class="placeholder rounded-3">Loading...</span>
        </div>`;
        
    const elements = [
        "getTotalUnits",
        "getTotalEvents",
        "getTotalRequests",
        "getTotalDonors",
        "get_events",
        "lowStock",
        "get_requests",
        "get_donors"
    ].map(id => document.getElementById(id));
    
    elements.forEach(element => element.innerHTML = placeholders);

        const [organizationResponse, inventoryResponse, donorResponse, eventResponse, requestResponse, profileResponse] = await Promise.all([
            fetchData("/api/mobile/organization"),
            fetchData("/api/inventory/all"),
            fetchData("/api/donor/all"),
            fetchData("/api/event/all"),
            fetchData("/api/bloodrequest/all"),
            fetchData("/api/profile/show")
        ]);

        const json_organization = await organizationResponse.json();
        const json_inventory = await inventoryResponse.json();
        const json_event = await eventResponse.json();
        const json_request = await requestResponse.json();
        const json_donor = await donorResponse.json();
        const json_profile = await profileResponse.json();
        
        let totalUnits = json_inventory.reduce((sum, stock) => sum + parseInt(stock.avail_blood_units), 0);
        
        handleEvents(json_event);
        handleRequests(json_request, json_organization);
        handleDonors(json_donor);
        handleStockAlerts(json_inventory);
        console.log('Naa bay sulod: ',json_inventory)

        let matchCount = 0;
        let orgName = json_organization.find(org => org.user_id === json_profile.id || org.user_id === json_profile.user_id);

        json_request.forEach(requests => {
            if (requests.receiver_id === json_profile?.id || requests.receiver_id === json_profile?.user_id) {
                matchCount++;
            }
        });

        document.getElementById("getOrgName").innerHTML = `${orgName.org_name}`;
        elements[0].innerHTML = `<h4 class="fw-bold">${totalUnits === "" ? 0 : totalUnits}</h4>`;
        elements[1].innerHTML = `<h4 class="fw-bold">${json_event.length === "" ? 0 : json_event.length}</h4>`;
        elements[2].innerHTML = `<h4 class="fw-bold">${matchCount}</h4>`;
        elements[3].innerHTML = `<h4 class="fw-bold">${json_donor.length === "" ? 0 : json_donor.length}</h4>`;

        function handleEvents(events) {
            let eventHTML = "";
            let hasEvents = events.some(event => event.status === "Scheduled");

            if (hasEvents) {
                events.slice(-4).reverse().forEach(event => {
                        eventHTML += createEventHTML(event);
                });
            } else {
                eventHTML = createNoEventsHTML();
            }
            document.getElementById("get_events").innerHTML = eventHTML;
            attachEventListeners();
        }

        function handleRequests(requests, organizations) {
            let requestHTML = "";
            let hasRequest = requests.some(request => request.status === "Pending");

            if (hasRequest) {
                requests.forEach(request => {
                    if (request.status === "Pending") {
                      const condition = localStorage.getItem("type") === "Blood Center" ? "request.receiver_id === organizations[0].user_id" : "request.user_id === organizations[0].user_id"


                      if(condition){
                        const org = organizations.find(org => org.user_id === request.user_id);
                        requestHTML += createRequestHTML(request, org);
                    }
                  }
                });
            } else {
                requestHTML = createNoRequestsHTML();
            }

            document.getElementById("get_requests").innerHTML = requestHTML;
            attachRequestListeners();
        }

        function handleDonors(donors) {
            let donorHTML = "";
            let hasDonor = donors.length > 0;

            if (hasDonor) {
                donors.slice(-5).forEach(donor => {
                    donorHTML += createDonorHTML(donor);
                });
            } else {
                donorHTML = createNoDonorsHTML();
            }

            document.getElementById("get_donors").innerHTML = donorHTML;
            attachDonorListeners();
        }

        function handleStockAlerts(inventory) {
            let alertHTML = "";
            let hasAlert = inventory.some(stock => parseInt(stock.avail_blood_units) < 10);

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
            return fetch(`${backendURL}${endpoint} `,{
                headers: {
                    Accept: "application/json",
                    Authorization: "Bearer " + localStorage.getItem("token"),
                },
            });
        }
   
    
}

function createEventHTML(event) {
    return`<!-- For Scheduled Event -->
    <div class="d-flex event-head shadow-sm">
        <div class="event-hasevents">
            ${event.event_name}
        </div>
        <div class="event-hasevents">${event.event_location}</div>
        <div class="event-hasevents">${event.start_date}</div>
        <div class="event-hasevents">${event.end_date}</div>
        <div class="event-hasevents">
            <div>
                <button
                    class="btn updateButton"
                    data-bs-toggle="modal"
                    data-bs-target="#viewEventModal_${event.event_id}"
                >
                    Details
                </button>
            </div>
        </div>
    </div>
    <!-- For Scheduled Event -->
    
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
              <td><strong>Gender:</strong></td>
              <td class="ps-4">${event.gender}</td>
            </tr>
            <tr>
              <td><strong>Weight:</strong></td>
              <td class="ps-4">${event.weight}</td>
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
          </table>
          </div>
          <div class="modal-footer">
           <div class="d-flex align-items-center justify-content-center">
            <button
                class="bg-secondary-subtle deleteEvent me-2 d-flex align-items-center justify-content-center"
                style="
                cursor: pointer;
                border-radius: 5px;
                padding: 7px !important;
                border: none !important;
                padding-left: 10px !important;
                padding-right: 10px !important;
                "
                data-id="${event.event_id}"
                >
              <img src="assets/icon/trash.png" alt="" width="16px" />
            </button>
            ${event.status !== "Completed" && event.status !== "Cancelled" ? `
            <form id="update_status_complete_${event.event_id}">
              <input type="hidden" name="status" value="Completed">
              <button
                type="submit"
                class="updateStatusEvent updateButton1 me-2"
                data-id="${event.event_id}"
                data-status="complete"
                style="font-size: 16px"
              >
                Finish
              </button>
            </form>
            <form id="update_status_cancel_${event.event_id}">
              <input type="hidden" name="status" value="Cancelled">
              <button
                type="submit"
                class="updateStatusEvent buttonBack1"
                data-id="${event.event_id}"
                data-status="cancel"
                style="font-size: 16px"
              >
                Cancel Event
              </button>
            </form>` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- View Event Modal -->`;
}

function createNoEventsHTML() {
return` <!-- For No Secheduled Event -->
            <div id="get_events"></div>
            <div class="d-flex event-head shadow-sm">
              <div class="event-noevents"></div>
              <div class="event-noevents"></div>
              <div class="event-noevents mt-3 mb-3">No Event</div>
              <div class="event-noevents"></div>
              <div class="event-noevents"></div>
            </div>
            <!-- For No Secheduled Event -->`;
}

function createRequestHTML(request, org) {
    return`<div class="d-flex has-head shadow-sm">
                    <div class="has-body">${org.org_name}</div>
                    <div class="has-body">${formatTimeDifference(request.created_at)}</div>
                    <div class="has-body">${request.blood_type}</div>
                    <div class="has-body">${request.component}</div>
                    <div class="has-body">${request.quantity}</div>
                    <div class="has-body">
                      <span class="bg-secondary-subtle py-2 px-4 rounded-4 fw-bold">${request.urgency_scale}</span>
                    </div>
                    <div class="has-body">
                      <div class="d-flex justify-content-center">
                        <button class="btn updateButton me-1" data-bs-toggle="modal" data-bs-target="#requestModal_${request.request_id}">
                          Details
                        </button>
                          <button
                              class="bg-secondary-subtle deleteRequest"
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
                 <!-- Request Modal -->
              <div
              class="modal fade"
              id="requestModal_${request.request_id}"
              tabindex="-1"
              aria-labelledby="requestModalLabel"
              aria-hidden="true"
              >
              <div class="modal-dialog modal-sm">
              <div class="modal-content">
              <div class="modal-header">
              <h5 class="modal-title" id="requestModalLabel">Event Details</h5>
              <button
                type="button"
                class="btn-close me-1"
                data-bs-dismiss="modal"
                aria-label="Close"
                style="box-shadow: none"
              ></button>
              </div>
              <div class="modal-body font-size">
              <span
                ><strong>Hospital: </strong>${org.org_name}
              </span>
              <span><br /><strong>Request at: </strong>${formatTimeDifference(request.created_at)}</span><br />
              <span class="me-4"><strong>Blood type: </strong>${request.blood_type}</span><br />
              <span><strong>Component: </strong>${request.component}</span><br />

              <span> <strong>Quantity: </strong>${request.quantity}</span><br />
              <span><strong>Status: </strong>${request.status}</span><br />
              <span><strong>Urgency Scale: </strong>${request.urgency_scale}</span><br />
              </div>
              <div class="modal-footer d-flex justify-content-end">
                ${request.status === "Pending" ? `
                <form id="update_status_accept_${request.request_id}">
                  <input type="hidden" name="status" value="Accepted">
                  <button class="btn btn-success rounded-2 updateRequest" data-id="${request.request_id}" data-status="accept">Accept</button>
                </form>
                <form id="update_status_decline_${request.request_id}">
                  <input type="hidden" name="status" value="Declined">
                  <button class="btn decline updateRequest" data-id="${request.request_id}" data-status="decline">Decline</button>
                </form>
              ` : request.status === "Accepted" ? `
                <form id="update_status_decline_${request.request_id}">
                  <input type="hidden" name="status" value="Declined">
                  <button class="btn decline updateRequest" data-id="${request.request_id}" data-status="decline">Decline</button>
                </form>
              ` : request.status === "Declined" ? `
                <form id="update_status_accept_${request.request_id}">
                  <input type="hidden" name="status" value="Accepted">
                  <button class="btn btn-success rounded-2 updateRequest" data-id="${request.request_id}" data-status="accept">Accept</button>
                </form>
              ` : ""}
              </div>
              </div>
              </div>
              </div>
              <!-- Request Modal -->`
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

function createDonorHTML(donor) {
  return `<div class="d-flex has-head shadow-sm">
          <div class="has-body">${donor.fullname}</div>
          <div class="has-body">${donor.blood_type.toUpperCase()}</div>
          <div class="has-body" style="overflow: hidden !important">${donor.address}</div>
          <div class="has-body">${donor.phonenumber}</div>
          <div class="has-body">${donor.email}</div>
           <div class="has-body">
                        <span class="bg-secondary-subtle py-1 px-3 rounded-4 ${donor.status === "Active" ? "text-success" : "text-danger"}">${donor.status}</span>
                      </div>
          <div class="has-body">
          
            <div class="d-flex justify-content-center"><button class="updateButton me-1" data-bs-toggle="modal" data-bs-target="#donorModal_${donor.donor_id}">Details</button> <button
                                class="bg-secondary-subtle deleteDonor"
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
            <div class="modal-dialog">
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
                  <span><strong>Email Address: </strong>${donor.email}</span><br />
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
                  <button type="button" class="btn btn-secondary me-1" data-bs-dismiss="modal" aria-label="Close">Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- View Donor Modal -->`
}

function createNoDonorsHTML() {
    return`<div class="d-flex shadow-sm">
          <div class="no-body"></div>
          <div class="no-body"></div>
          <div class="no-body"></div>
          <div class="no-body mt-3 mb-3">No Donor</div>
          <div class="no-body"></div>
          <div class="no-body"></div>
          <div class="no-body"></div>
        </div>`
}

function createAlertHTML(stock) {
   return`<div class="row p-1 mb-2">
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
                </div>`
}

function createNoStockAlertsHTML() {
    return`<div class="mt-4 text-center mb-4">
                  <img src="assets/icon/like.png" alt="" width="45px" /><br />
                  <div class="mt-2">No Low Stock</div>
              </div>`
}

function attachEventListeners() {
    document.querySelectorAll(".deleteEvent").forEach(button => button.addEventListener("click", deleteEventClick));
    document.querySelectorAll(".updateStatusEvent").forEach(button => button.addEventListener("click", updateStatusEvent));
}

function attachRequestListeners() {
    document.querySelectorAll(".deleteRequest").forEach(button => button.addEventListener("click", deleteRequestClick));
    document.querySelectorAll(".updateRequest").forEach(button => button.addEventListener("click", updateRequestClick));
}

function attachDonorListeners() {
    document.querySelectorAll(".deleteDonor").forEach(button => button.addEventListener("click", deleteDonorClick));
}

function updateStatusEvent(event) {
    const event_id = event.target.getAttribute("data-id");
    const event_status = event.target.getAttribute("data-status");
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
            headers: {
              Accept: "application/json",
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
            body: formData,
          });
  
          const json_event = await eventResponse.json();
  
          if (eventResponse.ok) {
            displayToastMessage("update-success");
            document.querySelector(`#viewEventModal_${id} .btn-close`).click();
            getDatas();
          } else {
            displayToastMessage("update-fail");
            console.error("Update status failed:", json_event.message);
          }
        };
    }
  }
  
  async function deleteEvent(id) {
  if (confirm("Are you sure you want to delete this event item?")) {
  const eventResponse = await fetch(backendURL + "/api/event/" + id, {
      method: "DELETE",
      headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
      },
  });
  
  const json_event = await eventResponse.json();
  
  if (eventResponse.ok) {
      displayToastMessage("delete-success");
      getDatas();
      document.querySelector(`#viewEventModal_${id} .btn-close`).click();
  } else {
      displayToastMessage("delete-fail");
      console.error("Delete failed:", json_event.message);
      }
    }
  }
  
  function deleteEventClick(event) {
  const event_id = event.currentTarget.getAttribute('data-id');
  console.log(event_id)
  deleteEvent(event_id);
  }

  function updateRequestClick(event) {
    const request_id = event.target.getAttribute("data-id");
    const request_status = event.target.getAttribute("data-status");
    console.log(request_status, request_id);
    updateRequestStatus(request_id, request_status);
  }
  
  async function updateRequestStatus(id, status) {
    if (confirm(`Are you sure you want to ${status} this request item?`)) {

        const statusFormId = status === "accept" ? `update_status_accept_${id}` : `update_status_decline_${id}`;
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
            document.querySelector(`#requestModal_${id} .btn-close`).click();
            getDatas();
          } else {
            displayToastMessage("update-fail");
            console.error("Update status failed:", json_request.message);
          }
        };
      }
    }
  
  async function deleteRequest(id) {
    if (confirm("Are you sure you want to delete this request item?")) {
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
        document.querySelector(`#requestModal_${id} .btn-close`).click();
        getDatas();
      } else {
        displayToastMessage("delete-fail");
        console.error("Delete failed:", json_request.message);
      }
    }
  }
  
  function deleteRequestClick(event) {
    const request_id = event.currentTarget.getAttribute('data-id');
    console.log(request_id);
    deleteRequest(request_id);
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
          getDatas();
        } else {
          displayToastMessage("delete-fail");
          console.error("Delete failed:", json_donor.message);
        }
    }
  }
  
  function deleteDonorClick(event) {
    const donor_id = event.currentTarget.getAttribute('data-id');
    console.log(donor_id);
    deleteDonor(donor_id);
  }