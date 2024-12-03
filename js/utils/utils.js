import { setRouter } from "../router/router.js";
setRouter();

// Backend URL
const backendURL = "http://bloodnet-backend.test";

const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + localStorage.getItem("token"),
};

async function userlogged(){
if(localStorage.getItem("token")){
    const profileResponse = await fetch(backendURL + "/api/profile/show", { headers });
    const organizationResponse = await fetch(backendURL + "/api/mobile/organization", { headers });

    const json_profile = await profileResponse.json();
    const json_organization = await organizationResponse.json();

    if(profileResponse.ok && organizationResponse.ok){  
        let foundUserID = false; 
            for (let index = 0; index < json_organization.length; index++) {
                const organization = json_organization[index]; 
                if(json_profile.id === organization.user_id || json_profile.user_id === organization.user_id  ){
                    console.log("found ID")
                    document.getElementById("user_id").value = organization.user_id;
                    foundUserID = true;
                    break;
                }
            } 
            if(!foundUserID){
                console.log("New User ID")
                document.getElementById("user_id").value = json_profile.id;
            }
        }else{
            console.log(json_profile.message)
    }
}
}

async function logout(){
    const btn_logout = document.getElementById("btn_logout");

    btn_logout.onclick = async () => {
        
    document.querySelector("#loader").innerHTML = `<div class="logoLoader">
        <img src="assets/imgs/redlogo.png" alt="bloodnet logo" /></div>`;
    
    document.getElementById("hide").classList.add('d-none');
    
    const logoutResponse = await fetch(backendURL + "/api/logout", {  headers }); 
        
    if(logoutResponse.ok){
        localStorage.clear();
        window.location.pathname = "/index.html";
    }else{
        const json = await logoutResponse.json();
        alert(json.message);
        }
    }
}

async function checkOrgInfoStatus() {
    document.querySelector("#loader").innerHTML = `<div class="logoLoader">
    <img src="assets/imgs/redlogo.png" alt="bloodnet logo" /></div>`;
    
    if (localStorage.getItem("token")) {
        const profileResponse = await fetch(backendURL + "/api/profile/show", { 
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
        },
     });
            const organizationResponse = await fetch(backendURL + "/api/mobile/organization", { headers });
        
        if (organizationResponse.ok && profileResponse.ok) {
            const json_organization = await organizationResponse.json();
            const profileData = await profileResponse.json();

            console.log("Organization Data:", json_organization);
            let redirectToDashboard = false;
                    for (let index = 0; index < json_organization.length; index++) {
                      if( profileData.id === json_organization[index].user_id || profileData.user_id === json_organization[index].user_id ){
                        redirectToDashboard = true;    
                            localStorage.setItem("type", json_organization[index].org_type);
                                if (json_organization[index].org_type === "Blood Center") {
                                    window.location.pathname = "/dashboard.html";
                                    break;
                                }else if(json_organization[index].org_type === "Hospital") {
                                    window.location.pathname = "/dashboardH.html";
                                    break;
                                }
                        }
                    }
                    if(!redirectToDashboard){
                        window.location.pathname = "/organizationInfo.html";
                    }
            } else {
                console.error("No organization data found.");
            }
        } else {
            console.error("Failed to fetch organization or profile information.");
        }
    }

    function jsonToCSV(jsonData) {
        const filteredData = jsonData.map(data => {
            const filteredRow = {};
            for (const key in data) {
                if (key !== 'created_at' && key !== 'updated_at' && key !== 'user_id') {
                    filteredRow[key] = data[key];
                }
            }
            return filteredRow;
        });

        const headers = Object.keys(filteredData[0]).join(',');
        const rows = filteredData.map(data => {
            return Object.values(data).map(value => `"${value}"`).join(',');
        });    
        return [headers, ...rows].join('\n');
    }
    
function formatTimeDifference(date) {
    const currentDate = new Date();
    const requestDate = new Date(date);
    const timeDifference = currentDate.getTime() - requestDate.getTime();
    const secondsDifference = Math.floor(timeDifference / 1000);
    const minutesDifference = Math.floor(secondsDifference / 60);
    const hoursDifference = Math.floor(minutesDifference / 60);
    const daysDifference = Math.floor(hoursDifference / 24);
    const weeksDifference = Math.floor(daysDifference / 7);
    const monthsDifference = Math.floor(daysDifference / 30);
    const yearsDifference = Math.floor(daysDifference / 365);

    if (secondsDifference < 60) {
        return '1 sec ago';
    } else if (minutesDifference < 2) {
        return `${minutesDifference} min ago`;
    } else if (minutesDifference < 60) {
        return `${minutesDifference} mins ago`;
    } else if (hoursDifference < 2) {
        return 'An hr ago';
    } else if (hoursDifference < 24) {
        return `${hoursDifference} hrs ago`;
    } else if (daysDifference < 2) {
        return 'A day ago';
    } else if (daysDifference < 7) {
        return `${daysDifference} days ago`;
    } else if (weeksDifference < 2) {
        return '1 week ago';
    } else if (weeksDifference < 4) {
        return `${weeksDifference} weeks ago`;
    } else if (monthsDifference < 2) {
        return 'A month ago';
    } else if (monthsDifference < 12) {
        return `${monthsDifference} months ago`;
    } else if (yearsDifference < 2) {
        return 'A year ago';
    } else {
        return `${yearsDifference} years ago`;
    }
}

function formatDateDifference(dateString) {
    const date = new Date(dateString);
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
}


function hasThreeMinutesPassed(createdAt) {
    const requestTime = new Date(createdAt);
    const currentTime = new Date();
    const timeDifference = (currentTime - requestTime) / 1000;  
    console.log(`Time difference: ${timeDifference} seconds`);
    return timeDifference > 180; 
  }
  

function setRoleAndPermission() {
    if (localStorage.getItem("type") === "Hospital") {
        let links = document.querySelectorAll(".HospitalLink");
        links.forEach(link => {
            link.classList.remove('d-none')
        });
    } else {
        let links = document.querySelectorAll(".BCLink");
        links.forEach(link => {
            link.classList.remove('d-none')
        });
    }
}

function displayToastMessage(type) {
    let message = '';
    let toastType = '';

    switch (type) {
        case 'update-success':
            message = 'Successfully updated.';
            toastType = 'bg-success';
            break;
        case 'update-fail':
            message = 'Failed to update. Please reload and try again.';
            toastType = 'bg-danger';
            break;
        case 'create-success':
            message = 'Successfully created.';
            toastType = 'bg-success';
            break;
        case 'create-fail':
            message = 'Failed to create. Please reload and try again.';
            toastType = 'bg-danger';
            break;
        case 'delete-success':
            message = 'Successfully deleted.';
            toastType = 'bg-success';
            break;
        case 'delete-fail':
            message = 'Failed to delete. Please reload and try again.';
            toastType = 'bg-danger';
            break;
        default:
            message = 'Unknown action.';
            toastType = 'bg-secondary';
    }

    const toastContainer = document.querySelector('#toast-container');

    if (!toastContainer) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="toast-container" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100;">
            </div>
        `);
    }

    const toastHTML = `
        <div class="toast align-items-center text-white ${toastType} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;

    document.querySelector('#toast-container').insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.querySelector('#toast-container .toast:last-child');
    const toast = new bootstrap.Toast(toastElement);

    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

async function getPendingRequest() {
    const getTotalPendingRequest = document.getElementById("getTotalPendingRequest");

    const requestResponse = await fetch(backendURL + "/api/bloodrequest/all", { headers });
    const json_request = await requestResponse.json();

    console.log(json_request);

    let pendingRequest = 0;
    json_request.forEach((request) =>{
      if(request.status === "Pending"){
        pendingRequest++;
      }
    })

    getTotalPendingRequest.innerHTML = `<span class="position-absolute top-50 translate-middle badge bg-danger" style="right: 0px">
    <span>${pendingRequest}</span><span class="visually-hidden">unread messages</span></span>`;
}

export { backendURL, logout, userlogged, checkOrgInfoStatus, jsonToCSV, setRoleAndPermission, formatTimeDifference, hasThreeMinutesPassed, formatDateDifference, displayToastMessage, getPendingRequest} 