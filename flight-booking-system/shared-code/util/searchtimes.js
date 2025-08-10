// Populate hour dropdown
const hourSelect = document.getElementById("departureHour");
if (hourSelect) {
    for (let i = 0; i < 24; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i.toString().padStart(2, '0') + ":00";
        hourSelect.appendChild(option);
    }
}

function FlightTime(hour) {
    const minute = Math.floor(Math.random() * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function randomPrice() {
    return (Math.random() * 300 + 50).toFixed(2);
}

function swapLocations() {
    const from = document.getElementById("departure");
    const to = document.getElementById("arrival");
    if (from && to) {
        const temp = from.value;
        from.value = to.value;
        to.value = temp;
    }
}

// Save data before redirecting
function recordSearch() {
    const from = document.getElementById("departure")?.value || "";
    const to = document.getElementById("arrival")?.value || "";
    const date = document.getElementById("departureDate")?.value || "";
    const hour = document.getElementById("departureHour")?.value || "";

    const searchData = { from, to, date, hour };
    localStorage.setItem("searchData", JSON.stringify(searchData));
}

// Use data from localStorage (for results page)
function showFlightTimes() {
    const container = document.getElementById("flight-times");
    if (!container) return;

    const searchData = JSON.parse(localStorage.getItem("searchData") || "{}");
    const { from = "Origin", to = "Destination", date = "Unknown", hour = 12 } = searchData;

    container.innerHTML = ""; // Clear old results

    for (let i = 0; i < 10; i++) {
        const time = FlightTime(hour);
        const price = randomPrice();
        const entry = document.createElement("div");
        entry.innerHTML = `
            <strong>Flight ${i + 1}</strong>: ${from} → ${to}<br>
            Date: ${date} at ${time}<br>
            Price: <span style="color:green;">$${price}</span><br>
            <button onclick="viewDetails('${from}', '${to}', '${date}', '${time}', '${price}')">View Details</button>
        `;
        container.appendChild(entry);
    }
}

function viewDetails(from, to, date, time, price) {
    alert(
        `Flight Details:\\n` +
        `From: ${from}\\n` +
        `To: ${to}\\n` +
        `Date: ${date}\\n` +
        `Time: ${time}\\n` +
        `Price: $${price}`
    );
}

// Optional: trigger on Enter if inputs exist
document.getElementById("departureDate")?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") showFlightTimes();
});
document.getElementById("departureHour")?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") showFlightTimes();
});

