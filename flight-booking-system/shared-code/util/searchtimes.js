const hourSelect = document.getElementById("arrival-hour");
for (let i = 0; i < 24; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i.toString().padStart(2, '0') + ":00";
    hourSelect.appendChild(option);
}

function FlightTime(hour) {
    const minute = Math.floor(Math.random() * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function randomPrice() {
    return (Math.random() * 300 + 50).toFixed(2);
}

function swapLocations() {
    const from = document.getElementById("from-location");
    const to = document.getElementById("to-location");
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
}

function showFlightTimes() {
    const hour = parseInt(document.getElementById("arrival-hour").value);
    const date = document.getElementById("arrival-date").value;
    const from = document.getElementById("from-location").value || "Unknown";
    const to = document.getElementById("to-location").value || "Unknown";

    if (!date) {
        alert("Please select a date.");
        return;
    }

    const container = document.getElementById("flight-times");
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
        `Flight Details:\n` +
        `From: ${from}\n` +
        `To: ${to}\n` +
        `Date: ${date}\n` +
        `Time: ${time}\n` +
        `Price: $${price}`
    );
}

document.getElementById("arrival-date").addEventListener("keydown", function (e) {
    if (e.key === "Enter") showFlightTimes();
});
document.getElementById("arrival-hour").addEventListener("keydown", function (e) {
    if (e.key === "Enter") showFlightTimes();
});
