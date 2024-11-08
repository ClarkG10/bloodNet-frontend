import { backendURL, logout, userlogged, displayToastMessage, setRoleAndPermission} from "../utils/utils.js";

setRoleAndPermission();
userlogged();
logout();

const createUser_form = document.getElementById("createUser_form");

createUser_form.onsubmit = async (e) => {
    e.preventDefault();

    const addButton = document.querySelector(".add");
    addButton.disabled = true;
    addButton.innerHTML = `<div class="spinner-border" role="status"></div>`;

    const formData = new FormData(createUser_form);

    const staffResponse = await fetch(backendURL + "/api/staff", {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer "+ localStorage.getItem("token"),
        },
        body: formData,
    });
    const json_staff = await staffResponse.json();

    if (staffResponse.ok) {
        createUser_form.reset();
        displayToastMessage("create-success");
        await getDatas();
    } else {
        displayToastMessage("create-fail");
        console.log(json_staff.message);
    }
    addButton.disabled = false;
    addButton.innerHTML = `Add`;
}

getDatas();
async function getDatas(keyword = "") {
    const getAdmin = document.getElementById("get_admin");
    const getStaff = document.getElementById("get_staff");
    const getStaffAdmin = document.getElementById("get_staffAdmin");
    const add_userButton = document.getElementById("add_userButton");

    const placeholder = `<div class="placeholder-glow mt-2" role="status">
          <span class="placeholder rounded-3">Loading...</span></div>`;

    getStaffAdmin.innerHTML = placeholder;
    getStaff.innerHTML = placeholder;

    let queryParams = 
    "?" + 
    // (url ? new URL(url).searchParams + "&" : "") + 
    (keyword ? "keyword=" + encodeURIComponent(keyword) + "&" : "");

    const staffResponse = await fetch(backendURL + "/api/staff/all" + queryParams, {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer "+ localStorage.getItem("token"),
        },
    });

    const profileResponse = await fetch(backendURL + "/api/profile/show", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer "+ localStorage.getItem("token"),
        },
    });

    const organizationResponse = await fetch(backendURL + "/api/mobile/organization", {
        headers: {
            Accept: "application/json",
        },
    });
    
    const json_staff = await staffResponse.json();
    const json_profile = await profileResponse.json();
    const json_organization = await organizationResponse.json();

    if(staffResponse.ok && profileResponse.ok){

        let adminHTML = "";
        let staffHTML = "";
        let staffAdminHTML = "";
        let addUserButton = "";
        let hasStaff = false;
        let index = 0;

        for (const org of json_organization) {
            index++
            if(json_profile.id === org.user_id || json_profile.user_id === org.user_id){
                adminHTML += `
                    <div class="d-flex ms-3 mt-2">
                        <div class="user-body" style="width: 220px !important">${org.org_name}<br><small style="color: #b43929">${org.org_email}</small></div>
                        <div class="user-body" style="width: 220px !important">${org.address}</div>
                        <div class="user-body" style="width: 420px !important">${org.contact_info}</div>
                        <div class="user-body text-success"  style="max-width: 200px !important"><span class="bg-secondary-subtle py-2 rounded-5" style="padding-right: 30px;padding-left: 30px;">${json_profile.role}</span></div>
                    </div>`;    
                }
        }

        getAdmin.innerHTML = adminHTML;

        json_staff.forEach(staff => {
            if(json_profile.user_id === staff.user_id || json_profile.id === staff.user_id  ){
            let staffContent = `
              <div class="d-flex ms-3 mt-2">
                <div class="user-body" style="width: 220px !important">${staff.fullname}<br><small style="color: #b43929">${staff.email}</small></div>
                <div class="user-body" style="width: 220px !important">${staff.address}</div>
                <div class="user-body" style="width: 420px !important">${staff.phonenumber}</div>
                <div class="user-body text-success"><span class="bg-secondary-subtle py-2  rounded-5" style="padding-right: 30px;padding-left: 30px;">${staff.role}</span></div>
                <div class="user-body flex-grow-1 ps-5">
                ${json_profile.role === "admin" ? ` <div class="d-flex justify-content-end align-items-end me-3">
                    <button class="updateButton me-2"
                            style="cursor: pointer"
                            data-bs-toggle="modal"
                            data-bs-target="#updateModal_${staff.staff_id}">
                      Update
                    </button>
                    <button class="bg-secondary-subtle deleteButton"
                            style="
                            cursor: pointer;
                            padding: 5px !important;
                            border-radius: 5px;
                            border: none !important;
                            padding-left: 12px !important;
                            padding-right: 12px !important;"
                            data-id="${staff.staff_id}">
                      <img src="assets/icon/trash.png" alt="" width="15px" />
                    </button>
                  </div>` : ""}
                </div>
              </div> 
                 <div
      class="modal fade"
      id="updateModal_${staff.staff_id}"
      tabindex="-1"
      aria-labelledby="updateModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="updateModalLabel">Update Role</h5>
          </div>
          <div class="modal-body">
          <div class="mb-4">
          <span class="font-size"><strong>Full Name: </strong>${staff.fullname}</span>
          <span class="font-size"><br /><strong>Email Address: </strong>${staff.email}</span><br />
          <span class="me-4 font-size"><strong>Phone Number: </strong>${staff.address}</span><br />
          </div>
            <form id="updateUser_form_${staff.staff_id}">
              <div class="form-floating mb-3">
                <select
                  class="form-select form-control"
                  id="role"
                  name="role"
                  required
                >
                 
                  <option ${staff.role == 'Admin' ? `Selected` : ``} value="admin">Admin</option>
                  <option ${staff.role == 'staff' ? `Selected` : ``} value="staff">Staff</option>
                </select>
                <label for="">Select Role</label>
              </div>
              <hr />
              <div class="d-flex align-items-end justify-content-end ">
                <button
                  type="submit"
                  class="button1 me-2 add updateRoleButton lign-items-center justify-content-center" style="font-size: 16px"
                  data-id="${staff.staff_id}"
                >
                  Update
                </button>
                <button
                  type="button"
                  class="buttonBack modal_close"
                  style="font-size: 16px"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>`;
           
            if (staff.role === "admin") {
                staffAdminHTML += staffContent;
            } else {
                hasStaff = true;
                staffHTML += staffContent;
            }
        }
        });


        if(json_profile.role === "admin"){
            addUserButton = `<button
            class="bloodCompatibilityChecker px-3 py-1"
            style="right: 37px; bottom: 668px; background-color: #b43929"
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#createUserModal"
          >
            Add new user
          </button>`
        }
        if (!hasStaff) {
            staffHTML = `<div class="d-flex text-center">
              <div class="user-body flex-grow-1 my-3">No Registered User</div>
            </div>`;
        }

        add_userButton.innerHTML = addUserButton;
        getStaffAdmin.innerHTML = staffAdminHTML;
        getStaff.innerHTML = staffHTML;
    }
    document.querySelectorAll(".deleteButton").forEach(button => {
        button.addEventListener("click", deleteClick);
    });

    document.querySelectorAll(".updateRoleButton").forEach(button => {
        button.addEventListener("click", updateClickStatus);
    });
}

const request_search_form = document.getElementById("search_form");
request_search_form.onsubmit = async (e) => {
    e.preventDefault(); 

    const formData = new FormData(request_search_form); 
    const keyword = formData.get("keyword");
    console.log(keyword);

    getDatas(keyword);
}

function updateClickStatus(event) {
    const user_id = event.target.getAttribute("data-id");
    console.log(user_id)
    updateRole(user_id);
  }


  async function updateRole(id) {
      if (confirm(`Are you sure you want to update this user?`)) {
          const role_form = document.getElementById("updateUser_form_" + id);
    
          role_form.onsubmit = async (e) => {
              e.preventDefault();
  
              const formData = new FormData(role_form);
              formData.append("_method", "PUT");
  
              const staffResponse = await fetch(backendURL + "/api/staff/role/" + id, {
                  method: "POST",
                  headers: {
                      Accept: "application/json",
                      Authorization: "Bearer " + localStorage.getItem("token"),
                  },
                  body: formData,
              });
  
              const json_staff = await staffResponse.json();
  
              if (staffResponse.ok) {
                  displayToastMessage("update-success");
                  document.querySelector(`#updateModal_${id} .modal_close`).click();
                  await getDatas();
              } else {
                  displayToastMessage("update-fail");
                  console.error("Update status failed:", json_staff.message);
              }
          }
      }
  }


async function deleteUser(id) {
if (confirm("Are you sure you want to delete this user?")) {
    const staffResponse = await fetch(backendURL + "/api/staff/" + id, {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const json_staff = await staffResponse.json();

    if (staffResponse.ok) {
        displayToastMessage("delete-success");
        await getDatas();
    } else {
        displayToastMessage("delete-fail");
        console.error("Delete failed:", json_staff.message);
    }
}
}

function deleteClick(event) {
const user_id = event.currentTarget.getAttribute('data-id');
console.log(user_id)
deleteUser(user_id);
}



