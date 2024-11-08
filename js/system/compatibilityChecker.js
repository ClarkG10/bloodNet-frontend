import { backendURL, logout } from "../utils/utils.js";

logout();

const blood_compatibility_form = document.getElementById("blood_compatibility_form");
const getInventory = document.getElementById("inventory"); 

    getInventory.innerHTML = `<div class="d-flex mt-1">
        <div class="no-body flex-grow-1 my-2">Search for available stocks</div></div>`

blood_compatibility_form.onsubmit = async (e) => {
    e.preventDefault();

    const placeholder = `<div class="d-flex shadow-sm">
          <div class="no-body flex-grow-1 my-2"><span class="spinner-border" role="status"></span></div></div>`

    getInventory.innerHTML = placeholder;

    const formData = new FormData(blood_compatibility_form); 
    const recipient_blood = formData.get("blood_type");

    const inventoryResponse = await fetch(backendURL + "/api/inventory/all", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    const json_inventory = await inventoryResponse.json();

    if (inventoryResponse.ok) {
        let stocks = "";
        let hasStocks = false;

        const isCompatible = (donor_blood, recipient_blood) => {
            const compatibilityChart = {
                "O-": ["O-"],
                "O+": ["O-", "O+"],
                "A-": ["A-", "O-"],
                "A+": ["A+", "AB+", "O-", "O+"],
                "B-": ["B-", "O-"],
                "B+": ["B+", "B-",  "O-", "O+"],
                "AB-": ["AB-", "B-", "O-", "A-"],
                "AB+": ["AB+", "AB-", "A-","A+","B+","B-","O-","O+",]
            };
            return compatibilityChart[recipient_blood].includes(donor_blood);
        };

        json_inventory.forEach(stock => {
            let blood_type = stock.blood_type.concat(stock.rh_factor);
            if (isCompatible(blood_type, recipient_blood)) {
                hasStocks = true;

                stocks += `<div class="d-flex mt-1 shadow-sm">
                              <div class="has-body flex-grow-1">${blood_type}</div>
                              <div class="has-body flex-grow-1">${stock.component}</div>
                              <div class="has-body flex-grow-1">${stock.avail_blood_units}</div>
                           </div>`;
            }
        });

        if(!hasStocks){
            stocks = `<div class="d-flex mt-1">
          <div class="no-body flex-grow-1 my-2">No Available Stocks</div></div>`
        }

        getInventory.innerHTML = stocks;
    }
};
