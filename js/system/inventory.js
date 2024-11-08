import { backendURL, logout, userlogged, jsonToCSV, setRoleAndPermission, formatDateDifference, displayToastMessage } from "../utils/utils.js";

logout();
userlogged();
setRoleAndPermission();

const inventory_form = document.getElementById("inventory_form");
const generateReportButton = document.getElementById("generateInventoryReport");

inventory_form.onsubmit = async (e) => {
    e.preventDefault();

    const addButton = document.querySelector("#add");
    addButton.disabled = true;
    addButton.innerHTML = `<div class="spinner-border" role="status"></div>`;

    const formData = new FormData(inventory_form);

    const getInventoryResponse = await fetch(backendURL + "/api/mobile/inventory", {
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

    const json_profile = await profileResponse.json();
    const json_inventoryAll = await getInventoryResponse.json();

    for(let i = 0; i < json_inventoryAll.length; i++) {
    if(json_profile.id === json_inventoryAll[i].user_id || json_profile.user_id === json_inventoryAll[i].user_id){
        // concat old inventory
        let blood_type = json_inventoryAll[i].blood_type.concat(json_inventoryAll[i].rh_factor);
        let bloodTypeWithComponent = blood_type.concat(json_inventoryAll[i].component);

        // concat new added inventory
        let new_blood_type = formData.get("blood_type").concat(formData.get("rh_factor"));
        let new_bloodTypeWithComponent = new_blood_type.concat(formData.get("component"));
        
        if(bloodTypeWithComponent === new_bloodTypeWithComponent) {
            alert("This blood type already exists in your inventory.");
            addButton.disabled = false;
            addButton.innerHTML = "Add";
            return;
        }
    }
}


    const inventoryResponse = await fetch(backendURL + "/api/inventory", {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer "+ localStorage.getItem("token"),
        },
        body: formData,
    });

    
    const json_inventory = await inventoryResponse.json();

    const id = json_inventory.inventory_id;

    const newAddedStockResponse = await fetch(backendURL + "/api/inventory/" + id, {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer "+ localStorage.getItem("token"),
        },
    });

    const newStock = await newAddedStockResponse.json();

    formData.append("units_in", newStock.avail_blood_units);
    formData.append("inventory_id", newStock.inventory_id);
    formData.append("user_id", newStock.user_id);

    const stockInResponse = await fetch(backendURL + "/api/stockIn", {
        method: "POST",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer "+ localStorage.getItem("token"),
        },
        body: formData,
    });

    const json_stockIn = await stockInResponse.json();

    if (inventoryResponse.ok ) {
        inventory_form.reset();
        displayToastMessage("create-success");
        await getDatas();
    } else {
        displayToastMessage("create-fail");
        console.log("Inventory", json_inventory.message);
        console.log("Stock in:",json_stockIn.message);

    }
    addButton.disabled = false;
    addButton.innerHTML = `Add`;
}

generateReportButton.onclick = async () => {
    const inventoryResponse = await fetch(backendURL + "/api/inventory/all", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        }
    });
  
    const json_inventory = await inventoryResponse.json();
    if (inventoryResponse.ok) {
        const csvData = jsonToCSV(json_inventory);
        downloadCSV(csvData, 'inventory_report.csv');
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
  

document.getElementById('sortComponent').addEventListener('change', function() {
    getDatas(this.value);
});

async function getDatas(filterComponent = 'All', url = null) {
    const blood_stocks = document.getElementById("blood_stocks");
    const alert = document.getElementById("alerts");

    blood_stocks.innerHTML = `
    <!-- loader for Inventory -->
  <div class="d-flex inventory-head shadow-sm">
          ${'<div class="inventory-body"><span class="spinner-border" role="status"></span></div>'.repeat(5)}
        </div>
    <!-- loader for Inventory -->`;

    const inventoryResponse = await fetch(url || backendURL + "/api/inventory", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        }
    });

    const inventoryResponseAll = await fetch(backendURL + "/api/inventory/all", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        }
    });

    const json_inventory = await inventoryResponse.json();
    const json_inventoryAll = await inventoryResponseAll.json();


    if (inventoryResponse.ok) {
        console.log("Inventory response:", json_inventory);

        let html = "";
        let hasStock = false;
        let totalUnits = 0;
        let alerts = "";
        let hasAlert = false;

        const inventoryData = json_inventory.data;

         if (Array.isArray(inventoryData)) {
        const filteredInventory = filterComponent === 'All' ? inventoryData : json_inventoryAll.filter(stock => stock.component === filterComponent);

            filteredInventory.forEach(stock => {
                hasStock = true;

                html += `
                    <div class="d-flex inventory-head shadow-sm">
                        <div class="inventory-body">${stock.blood_type}</div>
                        <div class="inventory-body fw-bold">${stock.rh_factor}</div>
                        <div class="inventory-body">${stock.component}</div>
                        <div class="inventory-body">${parseInt(stock.avail_blood_units)}</div>
                        <div class="inventory-body text-center" id="color">
                            <button
                                class="updateButton me-1"
                                style="cursor: pointer"
                                data-bs-toggle="modal"
                                data-bs-target="#upInventoryModal_${stock.inventory_id}"
                                data-id="${stock.inventory_id}"
                            >
                                Update
                            </button>
                                  <button
                                    class="bg-secondary-subtle deleteButton "
                                    style="
                                    cursor: pointer;
                                    padding: 5px !important;
                                    border-radius: 5px;
                                    border: none !important;
                                    padding-left: 12px !important;
                                    padding-right: 12px !important;
                                    "
                                    data-id="${stock.inventory_id}"
                                >
                                    <img src="assets/icon/trash.png" alt="" width="15px" />
                                </button>
                        </div>
                    </div>
                    <!-- Update Inventory Modal -->
                    <div
                        class="modal fade"
                        id="upInventoryModal_${stock.inventory_id}"
                        tabindex="-1"
                        aria-labelledby="upInventoryModalLabel"
                        aria-hidden="true"
                    >
                        <div class="modal-dialog modal-sm">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="upInventoryModalLabel">Update</h5>
                                </div>
                                <div class="modal-body">
                                    <span class="font-size"><strong>Blood type: </strong>${stock.blood_type}</span>
                                    <span class="font-size"><br /><strong>Rh factor: </strong>${stock.rh_factor}</span><br />
                                    <span class="font-size"><strong>Component: </strong>${stock.component}</span><br />
                                    <span class="font-size"><strong>Current Units: </strong>${stock.avail_blood_units}</span><br />
                                    <form id="update_units_${stock.inventory_id}">
                                        <div class="form-floating mb-3 mt-3" class="font-size">
                                            <input
                                                type="number"
                                                class="form-control"
                                                placeholder="Units"
                                                value="${stock.avail_blood_units}"
                                                name="avail_blood_units"
                                            />
                                            <label for="avail_blood_units" style="font-size: 16px">Update units</label>
                                        </div>
                                        <hr />
                                        <div class="d-flex align-items-end justify-content-end">
                                            <button type="submit" id="updateButton_${stock.inventory_id}" class="button1 me-2 d-flex justify-content-center align-items-center" style="font-size: 16px">Update</button>
                                            <button type="button" class="buttonBack" data-bs-dismiss="modal" style="font-size: 16px">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Update Inventory Modal -->`;
            });
         }  else {
            console.error("Unexpected data format:", json_inventory);
        }

        json_inventoryAll.forEach(stock => {
            totalUnits += parseInt(stock.avail_blood_units);
                        if (parseInt(stock.avail_blood_units) < 10) {
                        hasAlert = true;
                    alerts += `
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
                    });

        if (!hasStock) {
            html = `
                <!-- No Stock -->
                <div class="d-flex inventory-head shadow-sm">
                    <div class="inventory-nostocks"></div>
                    <div class="inventory-nostocks fw-bold"></div>
                    <div class="inventory-nostocks mt-3 mb-3">No Stock</div>
                    <div class="inventory-nostocks"></div>
                    <div class="inventory-nostocks text-center" id="color"></div>
                </div>
                <!-- No Stock -->`;
        }

        if (!hasAlert) {
            alerts = `
                <div class="mt-4 text-center mb-4">
                    <img src="assets/icon/like.png" alt="" width="45px" /><br />
                    <div class="mt-2">No Low Stock</div>
                </div>`;
        }

        html += `
            <div class="mt-3 font-size text-end me-4">
                <span id="color">Total blood units: </span>${totalUnits}
            </div>`;

        blood_stocks.innerHTML = html;
        alert.innerHTML = alerts;

        document.querySelectorAll(".deleteButton").forEach(button => {
            button.addEventListener("click", deleteClick);
        });

        document.querySelectorAll(".updateButton").forEach(button => {
            button.addEventListener("click", updateClick);
        });

        let pagination = "";

        if (json_inventory.links) {
            json_inventory.links.forEach((link) => {
                pagination += `
                    <li class="page-item" >
                        <a id="color" class="page-link ${link.url == null ? " disabled" : ""}${link.active ? " active" : ""}" href="#" id="pages" data-url="${link.url}" >
                            ${link.label}
                        </a>
                    </li>`;
            });
        }

        document.getElementById("pages").innerHTML = pagination;

        document.querySelectorAll("#pages").forEach((link) => {
            link.addEventListener("click", pageAction);
        });

        await getStocks();
    }
}

const pageAction = async (e) => {
    e.preventDefault();
    const url = e.target.getAttribute("data-url");
    await getDatas('All', url);
}

getDatas();

async function updateQuantity(id) {
    const update_form = document.getElementById("update_units_" + id);

    update_form.onsubmit = async (e) => {
        e.preventDefault();

    const updateButton = document.querySelector("#updateButton_" + id);
    updateButton.disabled = true;
    updateButton.innerHTML = `<div class="spinner-border" role="status"></div>`;

        const formData = new FormData(update_form);

        const prevResponse = await fetch(backendURL + "/api/inventory/" + id, {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
            }
        });
        const prevData = await prevResponse.json();
        const prevUnits = parseInt(prevData.avail_blood_units);
        const newUnits = parseInt(formData.get("avail_blood_units"));

        formData.append("_method", "PUT");
        update_form.querySelector("button[type='submit']").disabled = true;

        const inventoryResponse = await fetch(backendURL + "/api/inventory/bloodunits/" + id, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
            body: formData,
        });

        const json_inventory = await inventoryResponse.json();

        if (inventoryResponse.ok) {
            const stockData = new FormData();
            stockData.append("blood_type", prevData.blood_type);
            stockData.append("rh_factor", prevData.rh_factor);
            stockData.append("component", prevData.component);
            stockData.append("inventory_id", prevData.inventory_id);
            stockData.append("user_id", prevData.user_id);

            if (newUnits > prevUnits) {
                stockData.append("units_in", newUnits - prevUnits);
                await fetch(backendURL + "/api/stockIn", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    },
                    body: stockData,
                });
            } else if (newUnits < prevUnits) {
                stockData.append("units_out", prevUnits - newUnits);
                await fetch(backendURL + "/api/stockOut", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: "Bearer " + localStorage.getItem("token"),
                    },
                    body: stockData,
                });
            }
            displayToastMessage("update-success");
            document.querySelector(`#upInventoryModal_${id} .buttonBack`).click();
            await getDatas();
            await getStocks();
            
        } else {
            displayToastMessage("update-fail");
            console.error("Update failed:", json_inventory.message);
        }
        updateButton.disabled = false;
        updateButton.innerHTML = `Update`;
    }
}

function updateClick(e) {
    const inventory_id = e.target.getAttribute('data-id');
    console.log(inventory_id)
    updateQuantity(inventory_id);
}

async function deleteInventory(id) {
    if (confirm("Are you sure you want to delete this inventory item? related stocks update will be deleted as well in the history.")) {
        const inventoryResponse = await fetch(backendURL + "/api/inventory/" + id, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + localStorage.getItem("token"),
            },
        });

        const json_inventory = await inventoryResponse.json();

        if (inventoryResponse.ok) {
            displayToastMessage("delete-success");
            await getDatas();
        } else {
            displayToastMessage("delete-fail");
            console.error("Delete failed:", json_inventory.message);
        }
    }
}

function deleteClick(event) {
    const inventory_id = event.currentTarget.getAttribute('data-id');
    console.log(inventory_id)
    deleteInventory(inventory_id);
}


getStocks();
async function getStocks() {
    const stocksHistory = document.getElementById("stocksHistory");

    const stockInResponse = await fetch(backendURL + "/api/stockIn", {
        headers: {
            Accept: "application/json", 
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const stockOutResponse = await fetch(backendURL + "/api/stockOut", {
        headers: {
            Accept: "application/json", 
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const profileResponse = await fetch(backendURL + "/api/profile/show", {
        headers: {
            Accept: "application/json", 
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const stockInData = await stockInResponse.json();
    const stockOutData = await stockOutResponse.json();
    const profileData = await profileResponse.json();

    if(stockInResponse.ok && stockOutResponse.ok && profileResponse.ok){

        const combinedData = [...stockInData, ...stockOutData];
        combinedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        let stock = "";
        let hasStock = false;

        combinedData.forEach(stocks => {
            if(profileData.id == stocks.user_id || profileData.user_id == stocks.user_id){
            hasStock = true;
            stock += `<div
                  class="py-2 px-3 mb-2 ${stocks.units_in ? "bg-success" : "bg-danger"} rounded-3 text-white"
                  style="white-space: nowrap"
                >
                  ${stocks.blood_type}${stocks.rh_factor} ${stocks.component} (${stocks.units_in || stocks.units_out} units)
                  <br />
                  <small class="d-flex justify-content-end">${formatDateDifference(stocks.created_at)}</small>
                </div>`; 
            }
        });

        if(!hasStock){
            stock = `<div class="text center py-2 px-3 mt-2">No History</div>`
        }
        stocksHistory.innerHTML = stock;
    }
}
